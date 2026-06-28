from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

# auto_error=False so a missing header yields our own enveloped 401 instead of
# FastAPI's default {"detail": "Not authenticated"} string.
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)],
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the authenticated user from a ``Authorization: Bearer <jwt>`` header.

    Raises 401 if the token is missing, malformed, expired, or the user no
    longer exists. Route handlers depend on ``CurrentUser`` and stay unchanged —
    swapping the auth scheme only touches this function.
    """
    if credentials is None:
        raise UnauthorizedException()
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise UnauthorizedException("Invalid or expired session.")
    user = db.get(User, payload["sub"])
    if user is None:
        raise UnauthorizedException("Account not found.")
    return user


# ── Annotated type aliases ────────────────────────────────────────────────────
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
