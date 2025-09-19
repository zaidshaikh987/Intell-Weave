"""
scrapy_project/iw_crawler/spiders/news_spider.py
- Example spider that fetches article HTML and yields raw pages.
- Connect pipelines to save HTML to S3 and parsed data to Postgres.
"""
import scrapy

class NewsSpider(scrapy.Spider):
    name = "news"
    start_urls = [
        "https://example.com/news"
    ]

    def parse(self, response):
        for href in response.css('a::attr(href)').getall():
            if href and href.startswith('http'):
                yield scrapy.Request(href, callback=self.parse_article)

    def parse_article(self, response):
        yield {
            "url": response.url,
            "html": response.text,
        }
