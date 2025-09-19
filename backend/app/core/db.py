"""
app/core/db.py
- Database and cache connections.
- Exposes SQLAlchemy engine/session, Redis client, and S3 client helpers.
- Used by routers and services.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import redis
import boto3
from .config import settings

# SQLAlchemy
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Redis
redis_client = redis.from_url(settings.redis_url)

# S3
s3 = boto3.client(
    "s3",
    endpoint_url=settings.s3_endpoint_url,
    aws_access_key_id=settings.s3_access_key,
    aws_secret_access_key=settings.s3_secret_key,
)
