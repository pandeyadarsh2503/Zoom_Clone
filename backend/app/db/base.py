from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Shared declarative base for all SQLAlchemy ORM models.

    All models inherit from this class so that:
    - Alembic's autogenerate can discover them via `Base.metadata`.
    - `Base.metadata.create_all()` creates every table in one call.
    """
