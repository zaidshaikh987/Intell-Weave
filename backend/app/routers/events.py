"""
app/routers/events.py
- Ingestion of user events for personalization.
- Events: impressions, clicks, dwell, saves, likes, shares.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import insert
from ..core.db import get_db
from ..models.tables import user_events
from ..core.auth import get_current_user_id

router = APIRouter()

class EventIn(BaseModel):
    event_type: str = Field(pattern=r"^(impression|click|dwell|save|like|share)$")
    article_id: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)

@router.post("/")
def ingest_event(body: EventIn, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    db.execute(insert(user_events).values(user_id=user_id, article_id=body.article_id, event_type=body.event_type, properties=body.properties))
    db.commit()
    return {"status": "ok"}
