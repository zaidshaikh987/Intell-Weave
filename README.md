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


## 🏗️ Architecture
High-level system view. You can paste the Mermaid diagram into compatible viewers (e.g., GitHub, VS Code extensions) for a visual render.

```mermaid
flowchart LR
  subgraph Clients
    A[Web App (Vite/React)]
    B[Admin Dashboard]
    C[Partner Webhooks]
  end

  A -->|REST/WebSocket| G[(API Gateway/Ingress)]
  B -->|REST| G
  C -->|Ingestion Webhooks| G

  G --> F[FastAPI App]
  F <--> R[(Redis Cache)]
  F <--> DB[(Postgres + pgvector)]
  F <--> VS[(Vector DB: pgvector/Milvus/Pinecone)]
  F --> MQ[(Queue: Kafka/RabbitMQ/Redis Streams)]

  subgraph Workers & Pipelines
    W1[Scrapy Crawlers]
    W2[Parser & Normalizer]
    W3[NLP Pipeline (spaCy, VADER, SBERT, BERTopic)]
    W4[Summarizer & Claim Verifier (RAG)]
    W5[Recommender & Ranker]
  end

  MQ --> W1
  MQ --> W2
  MQ --> W3
  MQ --> W4
  MQ --> W5

  W1 -->|Raw HTML/Media| S3[(S3-Compatible Storage)]
  W2 --> DB
  W3 --> DB
  W3 --> VS
  W4 --> DB
  W5 --> DB

  subgraph Observability
    O1[Prometheus]
    O2[Grafana]
    O3[ELK / OpenSearch]
    O4[Sentry]
  end

  F --> O1
  F --> O3
  F --> O4
  W1 --> O1
  W2 --> O1
  W3 --> O1
  W4 --> O1
  W5 --> O1
  O1 --> O2
```

Textual (for terminals):

```
Clients (Web, Admin, Partners)
   | REST/WebSocket
Ingress / API Gateway
   |-> FastAPI (Auth, Feed, Search, Events, Admin)
       |-> Postgres (+pgvector)
       |-> Redis Cache
       |-> Vector Store (pgvector/Milvus/Pinecone)
       |-> Queue (Kafka/RabbitMQ/Redis Streams)

Workers
  - Scrapy Crawlers -> S3 raw HTML/media
  - Parser/Normalizer -> Postgres
  - NLP (spaCy, VADER, SBERT/BERTopic) -> Postgres + Vector store
  - Summarizer + Claim Verification (RAG) -> Postgres
  - Recommender/Ranker -> Postgres

Observability: Prometheus -> Grafana, ELK, Sentry
```


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


## 📎 Ready-to-paste LLM Prompt
Copy the entire block below into an LLM to generate end-to-end artifacts.

```
SYSTEM / INSTRUCTIONS: You are an expert full-stack ML/NLP engineer and product designer. Produce a complete, actionable, engineer-ready deliverable set for the product “Intell Weave” (AI News Aggregator). Use the features list and constraints below. Output must be structured and include code stubs, schemas, API specs, deployment manifests, tests, evaluation plan, UX copy, and a prioritized roadmap. Keep it concise but exhaustive. Return machine-ready artifacts where possible (OpenAPI YAML, SQL DDL, Kubernetes manifests, Dockerfiles, example FastAPI endpoints, Scrapy spider, sample data). All code must be syntactically valid and runnable with minimal adjustments.

PRODUCT SUMMARY:
Name: Intell Weave
Tagline: Weaving intelligence into every story.
Scope: Ingest 50K+ articles, parse/normalize, perform NER/sentiment/topic modeling/summarization/multimodal, serve personalized feeds with explainable RAG chat, claim verification, and audio/video micro-briefings. Provide dashboards, secure auth, scalable infra.

FEATURES (include all):
Ingestion: Distributed Scrapy spiders; RSS/sitemap/API connectors; S3 raw storage; media thumbnails; URL canonicalization; retries with backoff; scheduler (CronJobs/Airflow/K8s).
Parsing: BeautifulSoup + readability; fields (title, subtitle, body_text, body_html, author, published_at, images, tags, canonical_url, language, reading_time); sanitization; date/timezone normalization; near-duplicate detection (SimHash/MinHash).
NLP: Language detection; spaCy per-language; NER; entity linking (Wikidata/internal); sentiment (VADER + tuned classifier); keyphrases (YAKE/RAKE/TF-IDF); topic modeling (LDA + BERTopic/SBERT + HDBSCAN); embeddings (sentence-transformers); claim extraction; summarization (extractive + abstractive); multimodal (image salience, OCR, video frames).
Search: Full-text (pg_trgm/Elasticsearch) + vector (pgvector/Milvus/Pinecone); filters; materialized trending views.
Personalization: Event tracking; user profiles (topic/entity affinities, time patterns); cold start (onboarding + popularity/context); candidate gen (recency/trending/embedding/collaborative); two-stage ranking (ANN + LTR LightGBM/LambdaMART or BERT); diversity slider and MMR; federated/on-device option. Target: 60% F1 personalization, +40% engagement via A/B tests.
Verification: Credibility score (source trust + corroboration); RAG claim verification over trusted index; provenance ledger (signed metadata).
Multimodal: TL;DR + TTS micro-briefings; multimodal summaries (image + infographic + 3 frame preview); social clip generator.
UX: Personalized feed, Discover, Upload (file/URL/manual), Search, Bookmarks, Profile, Article detail; Explainable RAG Chat; timelines for events; feedback (thumbs, “why this,” report); newsletters, digests, push.
APIs: REST + optional WebSocket; OpenAPI; auth endpoints; admin/metrics; partner ingestion webhooks; exports (CSV/PDF/RSS).
Data/Storage: Postgres/Supabase; S3; Redis; vector store (pgvector/Milvus/Pinecone); sharding; retention; encryption.
Infra/Deploy: Docker; Kubernetes; Kafka/RabbitMQ/Redis Streams; autoscaling workers; CronJobs; CI/CD (GitHub Actions); CDN.
Security/Privacy: JWT + refresh; RBAC; OAuth; rate limiting; input validation; WAF; XSS/SQLi prevention; minimal PII; GDPR/CCPA; differential privacy & secure aggregation for federated learning; audit logs; TLS.
Monitoring/Eval: Prometheus/Grafana, ELK, Sentry; pipeline metrics (crawl success, backlog, index lag); product metrics (CTR, dwell, DAU/MAU, retention); offline metrics (precision@k, recall@k, NDCG@k, MAP; personalization F1); A/B framework with significance; holdouts/time-split.
Team/Process: Feature flags; rollback; docs/runbooks; CI gating for ML; experiment dashboards.
Monetization: Sponsored/native slots (labeled); B2B briefs; premium audio/dossiers/API.

TECH CONSTRAINTS:
Feed API latency target: <200ms p95 (with caching)
Daily crawl target: 50K articles
Cost: favor precomputed embeddings + ANN retrieval
Privacy: on-device/federated option
Languages: English + ≥3 languages configurable

DELIVERABLES (produce all):
One-page architecture diagram (ASCII/PlantUML/textual).
OpenAPI spec for core endpoints (auth, feed, article detail, events, search, topics, admin).
SQL DDL for core tables (articles, article_nlp, users, user_events, user_profiles, bookmarks) including pgvector.
FastAPI skeleton: auth, feed, article detail, events ingestion, search (vector example), topics, admin metrics.
Scrapy example: spider + pipeline saving raw HTML to S3 and parsed records to Postgres.
NLP pipeline spec: model choices, preprocessing, batching, orchestration (Celery/K8s), throughput targets.
Vector DB integration: pgvector or Milvus client code + nearest-neighbor retrieval example.
Claim verification: algorithm steps + pseudocode for RAG corroboration/conflict scoring and credibility computation.
Audio/video micro-briefing generator: TTS pipeline, caching, FFmpeg render example (short clip).
Federated personalization: architecture + secure aggregation pseudocode.
Library/model versions (spaCy models, sentence-transformers, VADER, summarization model).
Kubernetes manifests (Deployments/Services/Ingress + CronJob for crawler) and GitHub Actions CI workflow.
Monitoring & alerting: Prometheus rules; Grafana panels (CTR, crawl success, index lag; latency; error rate).
A/B testing plan: metrics, sample SQL to compute CTR/dwell/retention, significance testing approach.
Evaluation report template: offline (precision@k, NDCG, MAP, F1) + online (CTR/retention), go-live thresholds.
Roadmap & MVP: v0, v1, v2 with 2-week sprint timelines and priorities.
Security checklist & incident runbook.
Demo script (3–5 min) + UI copy (onboarding, credibility cards, “why this”).
Resume bullets & interview talking points.
Cost estimate (monthly): storage, compute, vector DB, bandwidth; “modest cluster.”
Test plan + sample pytest for key components (API, parsing, NLP, ranker).
Sample synthetic dataset (3 articles JSON) with expected NLP fields/embeddings and example API responses.
```


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
