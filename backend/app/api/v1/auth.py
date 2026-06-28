"""
Authentication — register + login.

Both return a bearer JWT and the user profile. Passwords are PBKDF2-hashed;
tokens are HS256 (see app/core/security.py).
"""
from __future__ import annotations

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import AuthResponse, LoginRequest, RegisterRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: User) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an account",
)
def register(payload: RegisterRequest, db: DbSession) -> AuthResponse:
    repo = UserRepository(db)
    email = payload.email.strip().lower()
    if repo.get_by_email(email):
        raise ConflictException("An account with that email already exists.")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        plan="free",
    )
    repo.create(user)
    return _token_response(user)


@router.post("/login", response_model=AuthResponse, summary="Sign in")
def login(payload: LoginRequest, db: DbSession) -> AuthResponse:
    repo = UserRepository(db)
    user = repo.get_by_email(payload.email)
    if user is None or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedException("Incorrect email or password.")
    return _token_response(user)


@router.get("/me", response_model=UserOut, summary="Current account")
def me(current_user: CurrentUser) -> User:
    return current_user
