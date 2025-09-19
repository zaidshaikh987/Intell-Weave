"""
app/main.py
- FastAPI application factory and router mounts.
- Generates OpenAPI schema (also hand-authored openapi.yaml exists for reference).
- Connected to routers in app/routers/* and services via dependency wiring.
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time

from .routers import auth, feed, article, events, search, topics, admin
from .routers import bookmarks
from .routers import profiles
from .routers import ingest
from .routers import chat
from .routers import multimodal
from .routers import verification
from .core.monitoring import metrics_collector, health_checker, create_metrics_response, setup_logging
from .core.security import add_security_headers

# Setup logging
setup_logging()

app = FastAPI(title="Intell Weave API", version="0.1.0")

# Security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # Configure for production

# CORS (adjust origins for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure specific origins for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Record metrics
    metrics_collector.record_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration=process_time
    )
    
    # Add security headers
    response = add_security_headers(response)
    
    return response

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
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(multimodal.router, prefix="/multimodal", tags=["multimodal"])
app.include_router(verification.router, prefix="/verification", tags=["verification"]) 

@app.get("/healthz")
async def healthz():
    """Health check endpoint."""
    health_status = await health_checker.get_health_status()
    return health_status

@app.get("/metrics")
def metrics():
    """Prometheus metrics endpoint."""
    return create_metrics_response()

@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "name": "Intell Weave API",
        "version": "0.1.0",
        "description": "AI-powered news aggregation and analysis platform",
        "docs_url": "/docs",
        "health_url": "/healthz",
        "metrics_url": "/metrics"
    }
