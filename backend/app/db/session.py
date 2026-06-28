from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# SQLite requires check_same_thread=False for multi-threaded use (FastAPI workers).
# For PostgreSQL this argument is not needed; remove it when switching engines.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=(
        {"check_same_thread": False}
        if settings.DATABASE_URL.startswith("sqlite")
        else {}
    ),
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy Session.

    The session is closed in the `finally` block regardless of whether the
    request succeeded or raised an exception, preventing connection leaks.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
