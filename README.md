# 🧠 Intell Weave — AI News Aggregator

> Weaving intelligence into every story.

Welcome to Intell Weave! This repository contains a scalable, production-minded AI news aggregation platform that ingests, parses, analyzes (NLP/multimodal), and serves personalized feeds with explainable RAG chat — with an emphasis on reliability, performance, and developer ergonomics.


## 🔗 Quick Links
- Backend FastAPI: `backend/app/`
- Frontend Vite/React/TS: `src/`
- Scrapy project: `backend/scrapy_project/`
- SQL DDL (core schema): `backend/app/models/sql_ddl.sql`
- Example environment: `backend/.env.example`


## 📚 Table of Contents
- [Architecture](#-architecture)
- [Features (Complete, Grouped, Implementable)](#-features-complete-grouped-implementable)
- [Quickstart](#-quickstart)
- [Environment Variables](#-environment-variables)
- [Developer Experience](#-developer-experience)
- [Ready-to-paste LLM Prompt](#-ready-to-paste-llm-prompt)
- [Roadmap & MVP](#-roadmap--mvp)
- [Contributing](#-contributing)


## ✅ Features (Complete, Grouped, Implementable)

- **Ingestion & Crawling**
  - Distributed Scrapy spiders with per-domain politeness, robots.txt, rate limits
  - RSS/sitemap/API connectors
  - Scheduler (CronJobs/Airflow/K8s) for periodic and near-real-time crawls
  - Raw HTML archival to S3-compatible storage (gzip + retention)
  - Media pipeline (images/videos) with thumbnails
  - URL canonicalization, redirect following, UTM stripping
  - Retry queue with exponential backoff; failure reporting

- **Parsing & Normalization**
  - BeautifulSoup + readability fallback for robust extraction
  - Fields: title, subtitle, body_text, body_html, author, published_at, images, tags, canonical_url, language, reading_time
  - Boilerplate removal, sanitization, Unicode/whitespace normalization
  - Date parsing with timezone normalization
  - Near-duplicate detection (SimHash/MinHash) and canonical merges

- **NLP Pipeline (Multilingual)**
  - Language detection (fastText/langdetect)
  - spaCy per-language (tokenization, lemmatization, POS), NER
  - Entity linking (Wikidata/internal KB)
  - Sentiment (NLTK VADER + tuned classifier)
  - Keyphrases (YAKE/RAKE/TF-IDF + embedding-based)
  - Topic modeling (LDA + BERTopic/SBERT + HDBSCAN)
  - Embeddings (sentence-transformers), stored for retrieval
  - Claim extraction for verification
  - Summarization: extractive + optional abstractive (TL;DR and long)
  - Multimodal: image salience, OCR on images, video keyframes

- **Search & Indexing**
  - Full-text search (Postgres + pg_trgm or Elasticsearch)
  - Vector search for semantic retrieval (pgvector/Milvus/Pinecone)
  - Materialized views for trending topics/hot articles/digests
  - Filters: source, topic, language, date, credibility score

- **Personalization & Recommender**
  - Event tracking: impressions, clicks, dwell time, saves, likes, shares, follows
  - User profiles: topic/entity affinities, time-of-day patterns, device prefs
  - Cold start: onboarding topic selection + popularity/context warm-start
  - Candidate generation: recent, trending, content similarity (embeddings), collaborative (item2vec)
  - Two-stage ranking: ANN retrieval + LTR re-ranker (LightGBM/LambdaMART or BERT ranker)
  - Diversity controls: user “diversity slider,” MMR diversification, fairness constraints
  - Federated/on-device option for privacy-first personalization
  - Target metrics: 60% F1 personalization; +40% engagement lift (A/B validated)

- **Verification, Trust & Safety**
  - Article credibility scoring (source trust, claim corroboration)
  - Claim verification via RAG over trusted-index with corroboration/conflict scoring
  - Provenance ledger: signed metadata (crawl timestamp, checksum, publisher)
  - Spam/low-quality detection; blocklists and heuristics
  - Moderation flows + human-in-the-loop review
  - Synthetic sandboxes for safety/bias testing

- **Multimodal & Creative Outputs**
  - Auto TL;DR + neural TTS micro-briefings (voices, speed, tone)
  - Multimodal summaries: best image + infographic (key stats) + 3-frame video preview
  - Auto-generated short social clips (headline animation + TTS + captions)
  - Cross-lingual perspective maps (framing/sentiment across locales)
  - Research dossiers/policy briefs with citations and timelines

- **Conversation & UX**
  - Explainable RAG Chat (“Ask the News”) with sources and provenance
  - Event timelines for evolving stories (entity- and burst-driven clustering)
  - Controls: follow topics, mute sources, diversity slider, audio preferences
  - Feedback UI: thumbs up/down, “why this,” report inaccuracies
  - Bookmarks/read-later, newsletters, scheduled digests, push alerts
  - Front-end views/pages: Feed, Discover, Upload (file/url/manual), Search, Bookmarks, Profile, Article detail
  - Components: PersonalizedBanner, TopicFilter, TrendingTopics, ArticleCard, ProcessingStatus

- **APIs & Integration (FastAPI)**
  - REST + optional WebSocket endpoints: auth, feed, article detail, events, search, topics, admin metrics
  - OpenAPI/Swagger auto-gen
  - Ingestion webhooks for partners
  - Export interfaces (CSV/PDF/RSS for curated lists)

- **Data & Storage**
  - Postgres/Supabase for structured data
  - S3-compatible object storage for raw HTML/media
  - Vector store (pgvector/Milvus/Pinecone)
  - Redis caches (session/user profile/feature store)
  - Sharded indices, retention/cold storage policies
  - Encryption at rest & in transit

- **Infrastructure & Deployment**
  - Dockerized services; Kubernetes orchestration
  - Queues (Kafka/RabbitMQ/Redis Streams) for pipelines
  - Worker autoscaling; CronJobs for crawling
  - CI/CD with GitHub Actions (tests, build, push, deploy)
  - CDN for audio/infographics/clips
  - Latency target: <200ms p95 feed (with caching)

- **Security & Compliance**
  - JWT + refresh tokens, RBAC, OAuth integrations
  - Rate limiting, input validation, WAF, XSS/SQLi protection
  - PII minimization, deletion/portability (GDPR/CCPA)
  - Differential privacy / secure aggregation for federated learning
  - HTTPS everywhere; key rotation; audit logs

- **Monitoring, Metrics & Evaluation**
  - Prometheus/Grafana for system & product metrics (CTR, dwell, DAU/MAU, retention)
  - Structured logging (ELK) with request IDs; Sentry for errors
  - Pipelines: crawl success, backlog, index lag
  - A/B testing framework; significance testing; holdouts/time splits
  - Offline ranking metrics: precision@k, recall@k, NDCG@k, MAP; personalization F1

- **Team, Process, Docs**
  - Feature flags & safe rollback
  - Experiment dashboards and weekly reviews
  - README/runbooks/API docs/onboarding guides
  - CI gates for ML model versioning & rollouts

- **Monetization**
  - Sponsored/native slots with labeling
  - B2B research briefs/dashboards
  - Premium audio briefings, dossiers, API access tiers


## 🚀 Quickstart

- **Prerequisites**
  - Python 3.10+
  - Node.js 18+ and npm
  - Postgres 14+ (with `pgvector` if using vector search)
  - Redis (for caching/queues)
  - S3-compatible storage (MinIO/AWS S3)

- **1) Backend setup**
  ```bash
  # from repo root
  python -m venv .venv
  . .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
  pip install -r backend/requirements.txt

  # copy and edit env
  cp backend/.env.example backend/.env

  # run dev server
  uvicorn app.main:app --reload --port 8000 --app-dir backend/app
  # Docs at: http://localhost:8000/docs
  ```

- **2) Frontend setup**
  ```bash
  npm install
  npm run dev  # Vite dev server, usually http://localhost:5173
  ```

- **3) Database**
  ```bash
  # Ensure Postgres is running and PGVECTOR is installed if needed
  # Apply schema (edit connection params or use a migration tool)
  psql "$DATABASE_URL" -f backend/app/models/sql_ddl.sql
  ```

- **4) Scrapy crawler (example)**
  ```bash
  # inside backend/scrapy_project
  scrapy list
  scrapy crawl example_spider -s JOBDIR=.jobs/example
  ```


## 🔐 Environment Variables
Use `backend/.env.example` as a starting point and create `backend/.env`.

- **Database**: `DATABASE_URL` (e.g., `postgresql+psycopg2://user:pass@localhost:5432/intellweave`)
- **S3**: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- **Auth**: `JWT_SECRET`, `JWT_ALG`, `JWT_EXPIRES_IN`
- **Vector**: `VECTOR_BACKEND` (pgvector|milvus|pinecone) and related keys
- **Misc**: `REDIS_URL`, `ENV`, `LOG_LEVEL`


## 🧑‍💻 Developer Experience

- **Paths**
  - FastAPI app: `backend/app/`
  - Routers: `backend/app/routers/` (e.g., `ingest.py`)
  - Models/DDL: `backend/app/models/` (see `sql_ddl.sql`)
  - Scrapy: `backend/scrapy_project/`
  - Frontend: `src/`

- **TypeScript & Tailwind**: Vite + React + TS + Tailwind (`tailwind.config.js`)
- **OpenAPI**: Visit `/docs` or `/redoc` once backend is running

## 🗺️ Roadmap & MVP

- **MVP**
  - Ingestion → parsing → minimal NLP (lang, NER, sentiment)
  - Embeddings + basic search
  - Personalized feed
  - Explainable RAG chat (with provenance)
  - Dashboards, JWT auth, deploy

- **V1/V2**
  - Claim verification, multimodal summaries
  - TTS micro-briefings, federated personalization
  - Video generator, credibility ledger, synthetic sandboxes


## 🤝 Contributing
- Fork, create a feature branch, open a PR.
- Add/adjust docs in this `README.md` for any new capabilities.
- Keep code formatted and typed (Black/ruff for Python, ESLint/Prettier/TypeScript for frontend).


---

Made with ❤️ by the Intell Weave team.
