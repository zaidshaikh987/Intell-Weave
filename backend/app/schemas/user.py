"""
app/schemas/user.py
- Pydantic models for user and auth payloads.
- Used by /auth, /feed personalization, and bookmarking.
"""
from pydantic import BaseModel
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class User(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    user_id: str
    preferred_topics: List[str] = []
