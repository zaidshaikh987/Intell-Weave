"""
app/routers/feed.py
- Feed endpoints returning personalized lists.
- Calls recommender service for candidate generation and ranking.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func
from ..core.db import get_db
from ..schemas.article import Article
from ..models.tables import articles, article_nlp, user_profiles
from typing import List
from ..core.auth import get_current_user_id
from ..services.recommender import get_personalized

router = APIRouter()

@router.get("/personalized", response_model=List[Article])
def personalized_feed(limit: int = 20, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    try:
        rows = get_personalized(user_id=user_id, limit=limit, db=db)
        return [Article(
            id=r['id'], title=r['title'], author=r['author'], source_url=r['source_url'], content=r['body_text'],
            reading_time=r['reading_time'], summary=r['summary'], sentiment=r['sentiment'], topics=r['topics'] or [],
            credibility_score=r['credibility_score'], key_entities=r['key_entities'] or [],
            published_at=r['created_at'].isoformat() if r.get('created_at') else None
        ) for r in rows]
    except Exception:
        return recent_feed(limit=limit, db=db)

@router.get("/recent", response_model=List[Article])
def recent_feed(limit: int = 20, db: Session = Depends(get_db)):
    q = (
        select(
            articles.c.id,
            articles.c.title,
            articles.c.author,
            articles.c.source_url,
            articles.c.body_text,
            articles.c.reading_time,
            articles.c.created_at,
            article_nlp.c.summary,
            article_nlp.c.sentiment,
            article_nlp.c.topics,
            article_nlp.c.credibility_score,
            article_nlp.c.key_entities,
        )
        .select_from(articles.outerjoin(article_nlp, article_nlp.c.article_id==articles.c.id))
        .order_by(desc(articles.c.created_at))
        .limit(limit)
    )
    rows = [dict(r) for r in db.execute(q).mappings().all()]
    return [Article(
        id=r['id'], title=r['title'], author=r['author'], source_url=r['source_url'], content=r['body_text'],
        reading_time=r['reading_time'], summary=r['summary'], sentiment=r['sentiment'], topics=r['topics'] or [],
        credibility_score=r['credibility_score'], key_entities=r['key_entities'] or [],
        published_at=r['created_at'].isoformat() if r['created_at'] else None
    ) for r in rows]
