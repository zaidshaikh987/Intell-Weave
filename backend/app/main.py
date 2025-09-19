"""
app/main.py
- FastAPI application factory and router mounts.
- Generates OpenAPI schema (also hand-authored openapi.yaml exists for reference).
- Connected to routers in app/routers/* and services via dependency wiring.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, feed, article, events, search, topics, admin
from .routers import bookmarks
from .routers import profiles
from .routers import ingest

app = FastAPI(title="Intell Weave API", version="0.1.0")

# CORS (adjust origins for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router mounts
app.include_router(auth.router, prefix="/auth", tags=["auth"]) 
app.include_router(feed.router, prefix="/feed", tags=["feed"]) 
app.include_router(article.router, prefix="/article", tags=["article"]) 
app.include_router(events.router, prefix="/events", tags=["events"]) 
app.include_router(search.router, prefix="/search", tags=["search"]) 
app.include_router(topics.router, prefix="/topics", tags=["topics"]) 
app.include_router(admin.router, prefix="/admin", tags=["admin"]) 
app.include_router(bookmarks.router, prefix="/bookmarks", tags=["bookmarks"]) 
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"]) 
app.include_router(ingest.router, prefix="/ingest", tags=["ingest"]) 

@app.get("/healthz")
def healthz():
    return {"status": "ok"}
