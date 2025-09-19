# Intell Weave Backend (FastAPI)

This folder contains the Python backend for Intell Weave: REST APIs, database schema, NLP pipeline skeletons, vector search, and ingestion interfaces.

Structure
- app/main.py — FastAPI app factory, router mounts, middleware. Generates OpenAPI.
- app/core/config.py — Settings (env vars), constants. Loads .env.
- app/core/db.py — Database engine/session (Postgres), Redis, and S3 clients.
- app/schemas/* — Pydantic models for request/response payloads.
- app/routers/* — API endpoints: auth, feed, article detail, events, search, topics, admin metrics.
- app/services/nlp.py — NLP pipeline skeleton (lang detect, NER, sentiment, embeddings, summarization).
- app/services/vector.py — Vector DB integration (pgvector). ANN retrieval example.
- app/services/recommender.py — Candidate generation + two-stage ranking stub.
- app/models/sql_ddl.sql — SQL DDL for core tables (Postgres + pgvector).
- openapi.yaml — Hand-authored spec to guide implementation; FastAPI also serves OpenAPI at /openapi.json.
- Dockerfile — Container build for the backend.
- docker-compose.yml — Local stack: Postgres (with pgvector), Redis, MinIO (S3), backend.
- k8s/ — Kubernetes manifests (Deployments, Services, Ingress, CronJob for crawler).

Quickstart
1) Copy .env.example to .env and fill values.
2) docker compose up -d
3) pip install -r requirements.txt && uvicorn app.main:app --reload

Notes
- This is an MVP skeleton to unblock end-to-end integration with the React frontend. Replace stubs with production logic incrementally.
