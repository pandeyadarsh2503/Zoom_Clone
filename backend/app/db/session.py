from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _normalize_db_url(url: str) -> str:
    """
    Managed hosts (Railway/Render/Heroku) hand out ``postgres://…`` URLs, but
    SQLAlchemy 2.0 only recognises the ``postgresql://`` scheme. Rewrite it so
    the same DATABASE_URL works locally and in production.
    """
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


_DB_URL = _normalize_db_url(settings.DATABASE_URL)
_is_sqlite = _DB_URL.startswith("sqlite")

# SQLite needs check_same_thread=False for FastAPI's threadpool. For server
# databases, pre-ping recycles connections dropped by the host between requests.
engine = create_engine(
    _DB_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=not _is_sqlite,
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
