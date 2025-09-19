"""
iw_crawler/pipelines.py
- Pipeline to store raw HTML in S3 and parsed content into Postgres.
- Uses BeautifulSoup for basic parsing and readability-like fallback.
"""
import gzip
import io
import os
import boto3
import psycopg
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from langdetect import detect as lang_detect
from readability import Document
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

S3_ENDPOINT = os.getenv('S3_ENDPOINT_URL', 'http://localhost:9000')
S3_ACCESS = os.getenv('S3_ACCESS_KEY', 'minioadmin')
S3_SECRET = os.getenv('S3_SECRET_KEY', 'minioadmin')
S3_BUCKET = os.getenv('S3_BUCKET', 'iw-raw')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+psycopg://postgres:postgres@localhost:5432/intell_weave')

class StoragePipeline:
    def open_spider(self, spider):
        self.s3 = boto3.client('s3', endpoint_url=S3_ENDPOINT, aws_access_key_id=S3_ACCESS, aws_secret_access_key=S3_SECRET)
        # psycopg connection for simple inserts
        self.db = psycopg.connect(DATABASE_URL.replace('+psycopg', ''))
        self.db.autocommit = True
        with self.db.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    def close_spider(self, spider):
        self.db.close()

    def process_item(self, item, spider):
        url = item['url']
        html = item['html']
        ts = datetime.now(timezone.utc)
        # upload raw html (gz)
        key = f"raw/{ts.strftime('%Y/%m/%d')}/{hash(url)}.html.gz"
        buf = io.BytesIO()
        with gzip.GzipFile(fileobj=buf, mode='wb') as gz:
            gz.write(html.encode('utf-8', errors='ignore'))
        buf.seek(0)
        self.s3.put_object(Bucket=S3_BUCKET, Key=key, Body=buf.getvalue(), ContentType='application/gzip')

        # readability extraction with BeautifulSoup fallback
        try:
            doc = Document(html)
            title = (doc.short_title() or '').strip()
            content_html = doc.summary(html_partial=True)
            soup_read = BeautifulSoup(content_html, 'lxml')
            paragraphs = [p.get_text(" ", strip=True) for p in soup_read.find_all('p')]
            body_text = "\n".join(paragraphs)[:20000]
            body_html = str(soup_read)[:50000]
            # subtitle as first h2/h3
            subtitle_tag = soup_read.find(['h2','h3'])
            subtitle = subtitle_tag.get_text(" ", strip=True)[:300] if subtitle_tag else None
        except Exception:
            soup = BeautifulSoup(html, 'lxml')
            title = (soup.title.string or '').strip() if soup.title else url
            paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all('p')]
            body_text = "\n".join(paragraphs)[:20000]
            body_html = None
            subtitle_tag = soup.find(['h2','h3'])
            subtitle = subtitle_tag.get_text(" ", strip=True)[:300] if subtitle_tag else None

        # canonical URL + UTM stripping
        soup_meta = BeautifulSoup(html, 'lxml')
        canon = soup_meta.find('link', rel=lambda v: v and 'canonical' in v)
        canonical_url = canon['href'].strip() if canon and canon.has_attr('href') else url
        def strip_utm(u: str) -> str:
            pr = urlparse(u)
            q = [(k, v) for k, v in parse_qsl(pr.query) if not k.lower().startswith('utm_')]
            return urlunparse((pr.scheme, pr.netloc, pr.path, pr.params, urlencode(q), pr.fragment))
        canonical_url = strip_utm(canonical_url)

        # publish date from meta
        pub = None
        for sel in [
            {'name': 'meta', 'key': 'property', 'val': 'article:published_time'},
            {'name': 'meta', 'key': 'name', 'val': 'pubdate'},
            {'name': 'meta', 'key': 'name', 'val': 'date'},
            {'name': 'meta', 'key': 'itemprop', 'val': 'datePublished'},
        ]:
            tag = soup_meta.find(sel['name'], attrs={sel['key']: sel['val']})
            if tag and tag.get('content'):
                try:
                    pub = datetime.fromisoformat(tag['content'].replace('Z', '+00:00'))
                    break
                except Exception:
                    continue

        # tags via meta keywords
        keywords = []
        meta_kw = soup_meta.find('meta', attrs={'name':'keywords'})
        if meta_kw and meta_kw.get('content'):
            keywords = [t.strip() for t in meta_kw['content'].split(',') if t.strip()]

        # author from meta
        author = None
        for sel in [
            {'name': 'meta', 'key': 'name', 'val': 'author'},
            {'name': 'meta', 'key': 'property', 'val': 'article:author'},
            {'name': 'meta', 'key': 'name', 'val': 'byl'},
        ]:
            tag = soup_meta.find(sel['name'], attrs={sel['key']: sel['val']})
            if tag and tag.get('content'):
                author = tag['content'].strip()
                break

        # language detection
        try:
            language = lang_detect(body_text) if body_text and len(body_text) > 40 else None
        except Exception:
            language = None

        # reading time estimate (~200 wpm)
        words = len(body_text.split()) if body_text else 0
        reading_time = max(1, words // 200) if words else None
        art_id = f"art_{abs(hash(canonical_url))}"
        with self.db.cursor() as cur:
            cur.execute("""
                INSERT INTO articles (id, title, subtitle, author, source_url, canonical_url, language, body_text, body_html, tags, reading_time, created_at, published_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (id) DO NOTHING
            """, (art_id, title or url, subtitle, author, url, canonical_url, language, body_text, body_html, keywords if keywords else None, reading_time, pub))
        return item
