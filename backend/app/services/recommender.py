"""
app/services/recommender.py
- Candidate generation and two-stage ranking (stub).
- Integrates with VectorIndex and event logs.
"""
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, text
from ..models.tables import articles, article_nlp, user_profiles
from ..services.nlp import nlp
from datetime import datetime, timezone

def _vec_literal(vec: List[float]) -> str:
    return f"[{','.join(str(round(float(x),6)) for x in vec)}]"

def get_personalized(user_id: str, limit: int, db: Session) -> List[Dict]:
    """
    Candidate generation:
      - Build a user query vector from preferred topics text (simple average embedding).
      - ANN retrieval from pgvector over article_nlp.embedding.
      - Merge with recent items; final score incorporates recency decay + credibility + vector rank.
    Returns rows with article fields ready for serialization.
    """
    # Build user text from preferred topics
    preferred = db.execute(select(user_profiles.c.preferred_topics).where(user_profiles.c.user_id==user_id)).scalar() or []
    user_text = " ".join(preferred) or "news"
    qvec = nlp.embed(user_text)
    rows_vec: List[Dict] = []
    try:
        sql = (
            """
            SELECT a.id, a.title, a.author, a.source_url, a.body_text, a.reading_time,
                   a.created_at,
                   n.summary, n.sentiment, n.topics, n.credibility_score, n.key_entities,
                   (n.embedding <-> :vec::vector) AS dist
            FROM articles a
            JOIN article_nlp n ON n.article_id = a.id
            WHERE n.embedding IS NOT NULL
            ORDER BY dist ASC
            LIMIT :limit
            """
        )
        rows_vec = [dict(r) for r in db.execute(sql, {"vec": _vec_literal(qvec), "limit": limit*2}).mappings().all()]
    except Exception:
        rows_vec = []

    # Recent
    q_recent = (
        select(
            articles.c.id, articles.c.title, articles.c.author, articles.c.source_url,
            articles.c.body_text, articles.c.reading_time, articles.c.created_at,
            article_nlp.c.summary, article_nlp.c.sentiment, article_nlp.c.topics,
            article_nlp.c.credibility_score, article_nlp.c.key_entities,
        )
        .select_from(articles.outerjoin(article_nlp, article_nlp.c.article_id==articles.c.id))
        .order_by(desc(articles.c.created_at))
        .limit(limit*2)
    )
    rows_recent = [dict(r) for r in db.execute(q_recent).mappings().all()]

    # Merge by id
    seen = {}
    for r in rows_vec + rows_recent:
        seen.setdefault(r['id'], r)
    merged = list(seen.values())

    now = datetime.now(timezone.utc)
    def score(row: Dict, rank: int) -> float:
        created = row.get('created_at')
        age_h = max(0.0, (now - created).total_seconds()/3600.0) if created else 1000.0
        recency = 0.5 ** (age_h / 48.0)
        credibility = (row.get('credibility_score') or 50.0) / 100.0
        vec_bonus = 0.3 if row in rows_vec[:limit] else 0.0
        topic_bonus = 0.0
        if preferred:
            arts = [t.lower() for t in (row.get('topics') or [])]
            topic_bonus = 0.2 if any(t in [p.lower() for p in preferred] for t in arts) else 0.0
        return 0.5*recency + 0.4*credibility + vec_bonus + topic_bonus

    merged.sort(key=lambda r: score(r, 0), reverse=True)
    return merged[:limit]
