"""
app/core/security.py
- JWT authentication, RBAC, and security utilities.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import redis
import time
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-change-in-production"  # Should come from env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Security bearer
security = HTTPBearer()

# Redis for rate limiting and session management
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

class RolePermissions:
    """Define role-based permissions."""
    
    PERMISSIONS = {
        "admin": [
            "read:all", "write:all", "delete:all",
            "manage:users", "manage:system", "view:analytics"
        ],
        "editor": [
            "read:articles", "write:articles", "edit:articles",
            "manage:content", "view:analytics"
        ],
        "user": [
            "read:articles", "read:own_data", "write:own_data",
            "bookmark:articles", "chat:system"
        ],
        "guest": [
            "read:public_articles"
        ]
    }
    
    @classmethod
    def has_permission(cls, role: str, permission: str) -> bool:
        """Check if role has specific permission."""
        return permission in cls.PERMISSIONS.get(role, [])
    
    @classmethod
    def get_permissions(cls, role: str) -> List[str]:
        """Get all permissions for a role."""
        return cls.PERMISSIONS.get(role, [])

class SecurityUtils:
    """Security utility functions."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

class RateLimiter:
    """Rate limiting implementation."""
    
    def __init__(self, redis_client=redis_client):
        self.redis = redis_client
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """
        Check if request is allowed based on rate limit.
        
        Args:
            key: Unique identifier (e.g., user_id, ip_address)
            limit: Maximum requests allowed
            window: Time window in seconds
        """
        try:
            current_time = int(time.time())
            pipeline = self.redis.pipeline()
            
            # Remove expired entries
            pipeline.zremrangebyscore(key, 0, current_time - window)
            
            # Count current requests
            pipeline.zcard(key)
            
            # Add current request
            pipeline.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipeline.expire(key, window)
            
            results = pipeline.execute()
            current_requests = results[1]
            
            return current_requests < limit
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            return True  # Allow on error to avoid blocking users

# Rate limiter instance
rate_limiter = RateLimiter()

def rate_limit(requests_per_minute: int = 60):
    """Rate limiting decorator."""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Get client IP
            client_ip = request.client.host
            
            # Create rate limit key
            key = f"rate_limit:{client_ip}:{func.__name__}"
            
            if not rate_limiter.is_allowed(key, requests_per_minute, 60):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)  # Will be properly injected
) -> Dict[str, Any]:
    """Get current authenticated user."""
    token = credentials.credentials
    payload = SecurityUtils.verify_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # In a real implementation, fetch user from database
    # For now, return user data from token
    return {
        "id": user_id,
        "email": payload.get("email"),
        "role": payload.get("role", "user"),
        "permissions": RolePermissions.get_permissions(payload.get("role", "user"))
    }

def require_permission(permission: str):
    """Decorator to require specific permission."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from kwargs
            current_user = None
            for arg in args:
                if isinstance(arg, dict) and "permissions" in arg:
                    current_user = arg
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if permission not in current_user.get("permissions", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(role: str):
    """Decorator to require specific role."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user from kwargs
            current_user = None
            for arg in args:
                if isinstance(arg, dict) and "role" in arg:
                    current_user = arg
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.get("role") != role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{role}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

class SessionManager:
    """Manage user sessions with Redis."""
    
    def __init__(self, redis_client=redis_client):
        self.redis = redis_client
    
    def create_session(self, user_id: str, session_data: Dict[str, Any]) -> str:
        """Create a new session."""
        session_id = f"session:{user_id}:{int(time.time())}"
        
        # Store session data
        self.redis.hset(session_id, mapping=session_data)
        self.redis.expire(session_id, 86400)  # 24 hours
        
        # Add to user's active sessions
        user_sessions_key = f"user_sessions:{user_id}"
        self.redis.sadd(user_sessions_key, session_id)
        self.redis.expire(user_sessions_key, 86400)
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        try:
            data = self.redis.hgetall(session_id)
            return data if data else None
        except Exception as e:
            logger.error(f"Session retrieval error: {e}")
            return None
    
    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate a session."""
        try:
            # Remove from Redis
            self.redis.delete(session_id)
            
            # Remove from user's active sessions
            if ":" in session_id:
                user_id = session_id.split(":")[1]
                user_sessions_key = f"user_sessions:{user_id}"
                self.redis.srem(user_sessions_key, session_id)
            
            return True
        except Exception as e:
            logger.error(f"Session invalidation error: {e}")
            return False
    
    def invalidate_all_user_sessions(self, user_id: str) -> bool:
        """Invalidate all sessions for a user."""
        try:
            user_sessions_key = f"user_sessions:{user_id}"
            sessions = self.redis.smembers(user_sessions_key)
            
            # Delete all sessions
            if sessions:
                self.redis.delete(*sessions)
            
            # Clear user sessions set
            self.redis.delete(user_sessions_key)
            
            return True
        except Exception as e:
            logger.error(f"User session invalidation error: {e}")
            return False

# Session manager instance
session_manager = SessionManager()

# Input validation utilities
class InputValidator:
    """Input validation and sanitization."""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Sanitize string input."""
        if not isinstance(value, str):
            raise ValueError("Input must be a string")
        
        # Remove null bytes and control characters
        sanitized = ''.join(char for char in value if ord(char) >= 32 or char in '\n\r\t')
        
        # Truncate if too long
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        
        return sanitized.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Basic email validation."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Basic URL validation."""
        import re
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        return re.match(pattern, url) is not None

# Security headers middleware
def add_security_headers(response):
    """Add security headers to response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
