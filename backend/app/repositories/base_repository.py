from __future__ import annotations

from typing import Generic, Optional, Type, TypeVar

from sqlalchemy.orm import Session

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic CRUD repository.

    Concrete repositories inherit from this class and pass their model type
    to the constructor. Business logic in services calls these methods rather
    than writing raw SQLAlchemy queries, keeping SQL confined to the repository
    layer and making services trivially testable via repository mocking.
    """

    def __init__(self, model: Type[ModelType], db: Session) -> None:
        self.model = model
        self.db = db

    def get_by_id(self, id: str) -> Optional[ModelType]:
        """Return the record with the given PK, or None if absent."""
        return self.db.get(self.model, id)

    def get_all(self) -> list[ModelType]:
        """Return every record of this model type."""
        return self.db.query(self.model).all()

    def create(self, obj: ModelType) -> ModelType:
        """Persist a new record and return the refreshed instance."""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self, obj: ModelType) -> ModelType:
        """
        Persist in-place mutations to an already-tracked ORM object.

        Call this after modifying attributes on an object fetched from the DB.
        """
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelType) -> None:
        """Hard-delete a record from the database."""
        self.db.delete(obj)
        self.db.commit()
