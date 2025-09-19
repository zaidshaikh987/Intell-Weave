"""
app/core/auth.py
- JWT helpers and FastAPI dependency to extract current user_id from Authorization header.
- For MVP, accepts any Bearer token signed with JWT_SECRET and returns subject as user_id.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from .config import settings

security = HTTPBearer(auto_error=False)

def get_current_user_id(token: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    if not token:
        return "u_demo"
    try:
        payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=[settings.jwt_alg])
        sub = payload.get("sub")
        if not sub:
            raise ValueError("missing sub")
        return str(sub)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
