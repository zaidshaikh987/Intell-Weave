"""
app/routers/topics.py
- Topic lists and trending topics materialized views (stub).
"""
from fastapi import APIRouter, Depends
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from ..core.db import get_db
from ..models.tables import articles, article_nlp

router = APIRouter()

@router.get("/trending")
def trending_topics(limit: int = 10, days: int = 7, db: Session = Depends(get_db)) -> List[Dict]:
    """Return trending topics with counts and average credibility in a recent window."""
    # Unnest topics and aggregate
    q = (
        select(
            func.unnest(func.coalesce(article_nlp.c.topics, [])).label('topic'),
            func.count().label('cnt'),
            func.avg(func.coalesce(article_nlp.c.credibility_score, 50.0)).label('avg_cred')
        )
        .select_from(articles.join(article_nlp, article_nlp.c.article_id==articles.c.id))
        .where(articles.c.created_at >= func.now() - func.make_interval(days=days))
        .group_by('topic')
        .order_by(desc('cnt'))
        .limit(limit)
    )
    rows = [dict(r) for r in db.execute(q).mappings().all()]
    return rows
