from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    Data-access layer for the User model.

    Inherits generic CRUD from BaseRepository and adds the single
    domain-specific query: fetching the seeded default user.
    """

    def __init__(self, db: Session) -> None:
        super().__init__(User, db)

    def get_default(self) -> Optional[User]:
        """
        Return the single seeded user row, or None if the DB is empty.

        In this phase there is always exactly one User row, but returning
        Optional[User] keeps the signature honest and lets callers raise
        an appropriate exception when the seed hasn't run.
        """
        return self.db.query(User).first()
