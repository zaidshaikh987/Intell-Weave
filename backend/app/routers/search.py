"""
app/routers/search.py
- Hybrid search endpoints (full-text + vector).
- Uses pgvector via services/vector.py (stubbed).
"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, and_, or_
from ..core.db import get_db
from ..schemas.article import Article
from ..models.tables import articles, article_nlp

router = APIRouter()

@router.get("/", response_model=List[Article])
def search(
    q: str,
    limit: int = 20,
    source: Optional[str] = None,
    topic: Optional[str] = None,
    language: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_cred: Optional[float] = None,
    db: Session = Depends(get_db),
):
    # Text search with pg_trgm similarity if available, otherwise ILIKE
    try:
        sim = func.similarity(articles.c.title, q) + func.similarity(articles.c.body_text, q)
        qy = (
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
            )
            .select_from(articles.outerjoin(article_nlp, article_nlp.c.article_id==articles.c.id))
            .order_by(desc(sim))
            .limit(limit)
        )
        # apply filters if any
        where = []
        if source:
            where.append(articles.c.source_url.ilike(f"%{source}%"))
        if topic:
            where.append(func.coalesce(article_nlp.c.topics, []).astext.ilike(f"%{topic}%"))
        if language:
            where.append(articles.c.language == language)
        if start_date:
            where.append(articles.c.published_at >= func.to_timestamp(func.extract('epoch', func.timestamp(start_date))))
        if end_date:
            where.append(articles.c.published_at <= func.to_timestamp(func.extract('epoch', func.timestamp(end_date))))
        if min_cred is not None:
            where.append((article_nlp.c.credibility_score >= min_cred))
        if where:
            qy = qy.where(and_(*where))
        rows = [dict(r) for r in db.execute(qy).mappings().all()]
    except Exception:
        qy = (
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
            )
            .select_from(articles.outerjoin(article_nlp, article_nlp.c.article_id==articles.c.id))
            .where((articles.c.title.ilike(f"%{q}%")) | (articles.c.body_text.ilike(f"%{q}%")))
            .limit(limit)
        )
        # basic filters on fallback
        if source:
            qy = qy.where(articles.c.source_url.ilike(f"%{source}%"))
        if language:
            qy = qy.where(articles.c.language == language)
        if min_cred is not None:
            qy = qy.where(article_nlp.c.credibility_score >= min_cred)
        rows = [dict(r) for r in db.execute(qy).mappings().all()]
    return [Article(
        id=r['id'], title=r['title'], author=r['author'], source_url=r['source_url'], content=r['body_text'],
        reading_time=r['reading_time'], summary=r['summary'], sentiment=r['sentiment'], topics=r['topics'] or [],
        credibility_score=r['credibility_score'], key_entities=r['key_entities'] or []
    ) for r in rows]

@router.get("/vector", response_model=List[Article])
def vector_search(
    q: str,
    limit: int = 20,
    source: Optional[str] = None,
    topic: Optional[str] = None,
    language: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_cred: Optional[float] = None,
    db: Session = Depends(get_db)
):
    from ..services.nlp import nlp
    try:
        emb = nlp.embed(q)
        vec_literal = f"[{','.join(str(round(float(x),6)) for x in emb)}]"
        # Use L2 distance operator <->; add optional filters
        base_sql = [
            "SELECT a.id, a.title, a.author, a.source_url, a.body_text, a.reading_time,",
            "       n.summary, n.sentiment, n.topics, n.credibility_score, n.key_entities,",
            "       (n.embedding <-> :vec::vector) AS dist",
            "FROM articles a",
            "JOIN article_nlp n ON n.article_id = a.id",
            "WHERE n.embedding IS NOT NULL",
        ]
        params = {"vec": vec_literal, "limit": limit}
        if source:
            base_sql.append("AND a.source_url ILIKE :source")
            params["source"] = f"%{source}%"
        if topic:
            base_sql.append("AND :topic = ANY (COALESCE(n.topics, ARRAY[]::text[]))")
            params["topic"] = topic
        if language:
            base_sql.append("AND a.language = :language")
            params["language"] = language
        if start_date:
            base_sql.append("AND a.published_at >= :start_date::timestamptz")
            params["start_date"] = start_date
        if end_date:
            base_sql.append("AND a.published_at <= :end_date::timestamptz")
            params["end_date"] = end_date
        if min_cred is not None:
            base_sql.append("AND COALESCE(n.credibility_score, 0) >= :min_cred")
            params["min_cred"] = float(min_cred)
        base_sql.append("ORDER BY dist ASC")
        base_sql.append("LIMIT :limit")
        sql = "\n".join(base_sql)
        rows = [dict(r) for r in db.execute(sql, params).mappings().all()]
        return [Article(
            id=r['id'], title=r['title'], author=r['author'], source_url=r['source_url'], content=r['body_text'],
            reading_time=r['reading_time'], summary=r['summary'], sentiment=r['sentiment'], topics=r['topics'] or [],
            credibility_score=r['credibility_score'], key_entities=r['key_entities'] or []
        ) for r in rows]
    except Exception:
        # Fallback to text search if pgvector not available
        return search(q=q, limit=limit, db=db)
