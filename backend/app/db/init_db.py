from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User

logger = logging.getLogger(__name__)


def seed_default_user(db: Session) -> None:
    """
    Idempotently ensures the demo account exists, with login credentials so the
    seeded sample data is reachable after sign-in (demo@zoom.clone / demo1234).

    If a user already exists but lacks credentials (legacy DB), backfill them.
    """
    existing: User | None = db.query(User).first()

    if existing is not None:
        if not existing.email or not existing.password_hash:
            existing.email = settings.DEMO_EMAIL
            existing.password_hash = hash_password(settings.DEMO_PASSWORD)
            db.commit()
            logger.info("Backfilled demo credentials on existing user %s", existing.id)
        else:
            logger.info("Demo user already seeded: %s (id=%s)", existing.email, existing.id)
        return

    user = User(
        email=settings.DEMO_EMAIL,
        password_hash=hash_password(settings.DEMO_PASSWORD),
        display_name=settings.DEFAULT_USER_DISPLAY_NAME,
        avatar_url=settings.DEFAULT_USER_AVATAR_URL or None,
        plan="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(
        "Seeded default user: display_name=%r, id=%s",
        user.display_name,
        user.id,
    )
