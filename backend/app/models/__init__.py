"""
app.models — ORM model registry.

Every model must be imported here so that:
- SQLAlchemy's Base.metadata knows about all tables.
- Alembic autogenerate discovers the full schema when it imports this module.
"""

from app.models.user import User

__all__: list[str] = ["User"]
