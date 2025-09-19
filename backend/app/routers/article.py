"""
app/routers/article.py
- Article detail and create endpoints.
- Connected to NLP pipeline for processing on write.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import insert, select, text
from ..schemas.article import Article, ArticleCreate
from ..core.db import get_db
from ..models.tables import articles, article_nlp
from ..services.nlp import nlp
import time, random

router = APIRouter()

@router.get("/{article_id}", response_model=Article)
def get_article(article_id: str, db: Session = Depends(get_db)):
    q = (
        select(
            articles.c.id,
            articles.c.title,
            articles.c.subtitle,
            articles.c.author,
            articles.c.source_url,
            articles.c.canonical_url,
            articles.c.language,
            articles.c.published_at,
            articles.c.body_text,
            articles.c.body_html,
            articles.c.reading_time,
            articles.c.tags,
            article_nlp.c.summary,
            article_nlp.c.sentiment,
            article_nlp.c.credibility_score,
            article_nlp.c.key_entities,
            article_nlp.c.topics,
        )
        .select_from(articles.outerjoin(article_nlp, article_nlp.c.article_id == articles.c.id))
        .where(articles.c.id == article_id)
    )
    row = db.execute(q).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return Article(
        id=row["id"],
        title=row["title"],
        subtitle=row["subtitle"],
        author=row["author"],
        source_url=row["source_url"],
        canonical_url=row["canonical_url"],
        language=row["language"],
        published_at=row["published_at"].isoformat() if row["published_at"] else None,
        content=row["body_text"],
        summary=row["summary"],
        reading_time=row["reading_time"],
        topics=row["topics"] or [],
        sentiment=row["sentiment"],
        credibility_score=row["credibility_score"],
        key_entities=row["key_entities"] or [],
    )

@router.post("/", response_model=Article)
def create_article(body: ArticleCreate, db: Session = Depends(get_db)):
    # generate id
    article_id = f"art_{int(time.time()*1000)}_{random.randint(1000,9999)}"
    # basic metrics
    analysis = nlp.analyze(body.content)
    reading_time = max(1, len(body.content)//1000)
    # insert
    db.execute(
        insert(articles).values(
            id=article_id,
            title=body.title,
            author=body.author,
            source_url=body.source_url,
            body_text=body.content,
            reading_time=reading_time,
        )
    )
    db.execute(
        insert(article_nlp).values(
            article_id=article_id,
            summary=analysis.get("summary"),
            sentiment=analysis.get("sentiment"),
            key_entities=analysis.get("entities"),
            topics=analysis.get("keyphrases"),
            credibility_score=70.0,
        )
    )
    # upsert embedding into pgvector column using raw SQL (MVP)
    try:
        emb = analysis.get("embedding", [])
        vec_literal = f"[{','.join(str(round(float(x),6)) for x in emb)}]"
        db.execute(text("""
            UPDATE article_nlp SET embedding = :vec::vector
            WHERE article_id = :aid
        """), {"vec": vec_literal, "aid": article_id})
    except Exception:
        # pgvector might be missing; ignore silently for MVP
        pass
    db.commit()
    return Article(id=article_id, title=body.title, content=body.content, summary=analysis.get("summary"), sentiment=analysis.get("sentiment"), topics=analysis.get("keyphrases", []), reading_time=reading_time)
