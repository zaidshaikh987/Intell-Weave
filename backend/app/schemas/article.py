"""
app/schemas/article.py
- Pydantic models for article payloads between API and clients.
- Connected to /feed, /article, /search endpoints.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class KeyEntity(BaseModel):
    name: str
    type: Optional[str] = None
    confidence: Optional[float] = None

class Article(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    source_url: Optional[str] = None
    canonical_url: Optional[str] = None
    language: Optional[str] = None
    reading_time: Optional[int] = None
    topics: List[str] = Field(default_factory=list)
    sentiment: Optional[str] = None
    credibility_score: Optional[float] = None
    key_entities: List[KeyEntity] = Field(default_factory=list)

class ArticleCreate(BaseModel):
    title: str
    content: str
    author: Optional[str] = None
    source_url: Optional[str] = None

class SearchQuery(BaseModel):
    q: str
    limit: int = 20
