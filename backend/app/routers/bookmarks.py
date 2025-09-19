"""
app/routers/bookmarks.py
- Bookmarks CRUD for users.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import insert, delete, select
from ..core.db import get_db
from ..models.tables import bookmarks, articles, article_nlp
from ..schemas.article import Article
from typing import List
import time, random

router = APIRouter()

@router.get("/", response_model=List[Article])
def list_bookmarks(user_id: str, db: Session = Depends(get_db)):
    q = (
        select(
            articles.c.id,
            articles.c.title,
            articles.c.author,
            articles.c.source_url,
            articles.c.body_text,
            articles.c.reading_time,
            article_nlp.c.summary,
            article_nlp.c.sentiment,
            article_nlp.c.topics,
            article_nlp.c.credibility_score,
            article_nlp.c.key_entities,
            articles.c.published_at,
        )
        .select_from(bookmarks.join(articles, bookmarks.c.article_id==articles.c.id).outerjoin(article_nlp, article_nlp.c.article_id==articles.c.id))
        .where(bookmarks.c.user_id==user_id)
        .order_by(bookmarks.c.created_at.desc())
    )
    rows = [dict(r) for r in db.execute(q).mappings().all()]
    return [Article(
        id=r['id'], title=r['title'], author=r['author'], source_url=r['source_url'], content=r['body_text'],
        reading_time=r['reading_time'], summary=r['summary'], sentiment=r['sentiment'], topics=r['topics'] or [],
        credibility_score=r['credibility_score'], key_entities=r['key_entities'] or [],
        published_at=r['published_at'].isoformat() if r['published_at'] else None
    ) for r in rows]

@router.post("/")
def create_bookmark(user_id: str, article_id: str, db: Session = Depends(get_db)):
    bid = f"bm_{int(time.time()*1000)}_{random.randint(1000,9999)}"
    db.execute(insert(bookmarks).values(id=bid, user_id=user_id, article_id=article_id))
    db.commit()
    return {"id": bid, "status": "ok"}

@router.delete("/")
def delete_bookmark(user_id: str, article_id: str, db: Session = Depends(get_db)):
    db.execute(delete(bookmarks).where((bookmarks.c.user_id==user_id) & (bookmarks.c.article_id==article_id)))
    db.commit()
    return {"status": "deleted"}
