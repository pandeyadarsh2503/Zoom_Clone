from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def seed_default_user(db: Session) -> None:
    """
    Idempotently ensures the single default user exists in the database.

    Called during application startup. If the user already exists (e.g. on
    every restart after the first), this function is a cheap no-op.
    """
    existing: User | None = db.query(User).first()

    if existing is not None:
        logger.info("Default user already seeded: %s (id=%s)", existing.display_name, existing.id)
        return

    user = User(
        display_name=settings.DEFAULT_USER_DISPLAY_NAME,
        avatar_url=settings.DEFAULT_USER_AVATAR_URL or None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(
        "Seeded default user: display_name=%r, id=%s",
        user.display_name,
        user.id,
    )
