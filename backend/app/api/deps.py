from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.user import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    """
    Resolves the active user from the database without token validation.

    Design decision: the function signature is intentionally identical to what
    a real JWT-based implementation would expose. Every route handler that needs
    the current user depends on `CurrentUser`; adding authentication later only
    requires changing the body of this single function — no route signatures
    change.
    """
    user = db.query(User).first()
    if user is None:
        raise NotFoundException("User", "default")
    return user


# ── Annotated type aliases ────────────────────────────────────────────────────
# Using Annotated aliases keeps route signatures clean:
#   def my_route(db: DbSession, user: CurrentUser) -> ...
# rather than repeating Depends(...) everywhere.

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
