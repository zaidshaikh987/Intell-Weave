"""
app/models/tables.py
- SQLAlchemy Core table definitions for Postgres schema (matches sql_ddl.sql).
- Used by routers to run queries without a heavy ORM layer.
"""
from sqlalchemy import Table, Column, Text, Integer, TIMESTAMP, ARRAY, JSON, Float, MetaData
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from sqlalchemy.dialects.postgresql import JSONB

metadata = MetaData()

articles = Table(
    "articles", metadata,
    Column("id", Text, primary_key=True),
    Column("title", Text, nullable=False),
    Column("subtitle", Text),
    Column("author", Text),
    Column("source_url", Text),
    Column("canonical_url", Text),
    Column("language", Text),
    Column("published_at", TIMESTAMP(timezone=True)),
    Column("body_text", Text),
    Column("body_html", Text),
    Column("reading_time", Integer),
    Column("tags", PG_ARRAY(Text)),
    Column("created_at", TIMESTAMP(timezone=True)),
)

article_nlp = Table(
    "article_nlp", metadata,
    Column("article_id", Text, primary_key=True),
    Column("summary", Text),
    Column("sentiment", Text),
    Column("credibility_score", Float),
    Column("key_entities", JSONB),
    Column("topics", PG_ARRAY(Text)),
    # embedding vector(384) handled via raw SQL for insert/query
)

users = Table(
    "users", metadata,
    Column("id", Text, primary_key=True),
    Column("email", Text),
    Column("full_name", Text),
    Column("created_at", TIMESTAMP(timezone=True)),
)

user_profiles = Table(
    "user_profiles", metadata,
    Column("id", Text, primary_key=True),
    Column("user_id", Text),
    Column("preferred_topics", PG_ARRAY(Text)),
)

bookmarks = Table(
    "bookmarks", metadata,
    Column("id", Text, primary_key=True),
    Column("user_id", Text),
    Column("article_id", Text),
    Column("created_at", TIMESTAMP(timezone=True)),
)

user_events = Table(
    "user_events", metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Text),
    Column("article_id", Text),
    Column("event_type", Text),
    Column("ts", TIMESTAMP(timezone=True)),
    Column("properties", JSONB),
)
