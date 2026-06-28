from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """
    Represents the single application user.

    In this phase, one User row is seeded at startup and assumed to be the
    active user for all operations (no authentication required).

    The schema is intentionally identical to what a multi-user system would
    need, so adding authentication later requires only additive migrations.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        doc="UUID primary key — safe to expose in URLs.",
    )
    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Human-readable name shown in the UI.",
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        doc="Optional URL to a profile picture.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!r} display_name={self.display_name!r}>"
