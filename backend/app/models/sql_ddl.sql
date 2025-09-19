-- app/models/sql_ddl.sql
-- Core tables for Intell Weave (Postgres + pgvector)

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  source_url TEXT,
  canonical_url TEXT,
  language TEXT,
  published_at TIMESTAMPTZ,
  body_text TEXT,
  body_html TEXT,
  reading_time INT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_nlp (
  article_id TEXT PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  summary TEXT,
  sentiment TEXT,
  credibility_score REAL,
  key_entities JSONB,
  topics TEXT[],
  embedding vector(384)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  preferred_topics TEXT[]
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_events (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  article_id TEXT,
  event_type TEXT,
  ts TIMESTAMPTZ DEFAULT NOW(),
  properties JSONB
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_body_trgm ON articles USING gin (body_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_article_nlp_embedding ON article_nlp USING ivfflat (embedding vector_l2_ops);
