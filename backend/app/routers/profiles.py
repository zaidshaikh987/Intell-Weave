"""
app/routers/profiles.py
- Profiles get/update endpoints used for personalization preferences.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import insert, select, update
from ..core.db import get_db
from ..models.tables import user_profiles
from ..schemas.user import UserProfile

router = APIRouter()

@router.get("/{user_id}")
def get_profile(user_id: str, db: Session = Depends(get_db)):
  row = db.execute(select(user_profiles).where(user_profiles.c.user_id==user_id)).mappings().first()
  if not row:
    return None
  return UserProfile(id=row['id'], user_id=row['user_id'], preferred_topics=row['preferred_topics'] or [])

@router.post("/{user_id}")
def upsert_profile(user_id: str, body: dict, db: Session = Depends(get_db)):
  row = db.execute(select(user_profiles).where(user_profiles.c.user_id==user_id)).mappings().first()
  if row:
    db.execute(update(user_profiles).where(user_profiles.c.user_id==user_id).values(preferred_topics=body.get('preferred_topics', [])))
  else:
    db.execute(insert(user_profiles).values(id=f"prof_{user_id}", user_id=user_id, preferred_topics=body.get('preferred_topics', [])))
  db.commit()
  return {"id": f"prof_{user_id}", "user_id": user_id, "preferred_topics": body.get('preferred_topics', [])}
