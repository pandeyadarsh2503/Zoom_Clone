from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    """Fields shared between request and response schemas."""

    display_name: str = Field(..., min_length=1, max_length=100)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class UserUpdate(BaseModel):
    """
    PATCH /users/me — all fields are optional.

    Only the fields present in the request body are applied; absent fields
    leave the current value untouched.
    """

    display_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    avatar_url: Optional[str] = Field(default=None, max_length=500)


class UserOut(UserBase):
    """
    API response representation of a User.

    `from_attributes=True` tells Pydantic to read values from ORM model
    attributes rather than requiring a dict — no manual `.model_dump()` needed.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: Optional[str] = None
    plan: str = "free"
    created_at: datetime
    updated_at: datetime


class RegisterRequest(BaseModel):
    """POST /auth/register body."""

    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    """POST /auth/login body."""

    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class AuthResponse(BaseModel):
    """Returned by register + login — a bearer token and the user profile."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
