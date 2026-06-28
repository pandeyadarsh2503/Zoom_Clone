from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.repositories.base_repository import BaseRepository


class ContactRepository(BaseRepository[Contact]):
    """Data-access for a user's contact directory."""

    def __init__(self, db: Session) -> None:
        super().__init__(Contact, db)

    def get_for_owner(self, owner_id: str) -> list[Contact]:
        return (
            self.db.query(Contact)
            .filter(Contact.owner_id == owner_id)
            .order_by(Contact.name.asc())
            .all()
        )

    def get_owned(self, contact_id: str, owner_id: str) -> Optional[Contact]:
        return (
            self.db.query(Contact)
            .filter(Contact.id == contact_id, Contact.owner_id == owner_id)
            .first()
        )
