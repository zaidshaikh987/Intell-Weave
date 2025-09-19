"""
app/routers/auth.py
- Auth endpoints (mock JWT for MVP).
- Connected to frontend sign-in/sign-out flows.
"""
from fastapi import APIRouter
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta, timezone
from ..schemas.user import Token, User
from ..core.config import settings

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    full_name: str | None = None

@router.post("/login", response_model=Token)
def login(body: LoginRequest):
    # NOTE: replace with real password/OAuth flows in production
    now = datetime.now(timezone.utc)
    payload = {
        "sub": body.email.split("@")[0],
        "email": body.email,
        "name": body.full_name or "",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=12)).timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)
    return Token(access_token=token, token_type="bearer")

@router.get("/me", response_model=User)
def me():
    return User(id="u_demo", email="guest@example.com", full_name="Guest User")
