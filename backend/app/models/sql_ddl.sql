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
  sentiment JSONB,
  credibility_score REAL,
  key_entities JSONB,
  topics TEXT[],
  embedding vector(384),
  keyphrases TEXT[],
  claims TEXT[],
  language TEXT,
  reading_time INT,
  duplicate_hash TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
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

-- New tables for advanced features
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  message_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- 'user_question', 'system_response'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_media (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'image', 'video', 'audio'
  file_path TEXT,
  file_url TEXT,
  metadata JSONB,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credibility_assessments (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
  overall_score REAL NOT NULL,
  factors JSONB NOT NULL,
  provenance JSONB,
  assessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_verifications (
  id TEXT PRIMARY KEY,
  claim_text TEXT NOT NULL,
  verification_score REAL,
  supporting_evidence JSONB,
  conflicting_evidence JSONB,
  confidence REAL,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_body_trgm ON articles USING gin (body_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_article_nlp_embedding ON article_nlp USING ivfflat (embedding vector_l2_ops);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events (user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_article_id ON user_events (article_id);
CREATE INDEX IF NOT EXISTS idx_user_events_ts ON user_events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_article_media_article_id ON article_media (article_id);
CREATE INDEX IF NOT EXISTS idx_credibility_assessments_article_id ON credibility_assessments (article_id);
