"""
Contacts — a per-user directory backed by the database.

`status` is overlaid with **live** presence: a contact whose email matches a
currently-connected account is reported "online" regardless of its stored value.
"""
from __future__ import annotations

import random

from fastapi import APIRouter, Response, status

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundException
from app.models.contact import Contact
from app.repositories.contact_repo import ContactRepository
from app.schemas.contact import ContactCreate, ContactListOut, ContactOut
from app.websocket.presence import is_online

router = APIRouter(prefix="/contacts", tags=["contacts"])

_ACCENTS = [
    "from-rose-500 to-orange-500",
    "from-sky-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-600",
    "from-fuchsia-500 to-purple-600",
    "from-violet-500 to-blue-500",
]


def _serialize(c: Contact) -> ContactOut:
    return ContactOut(
        id=c.id,
        name=c.name,
        email=c.email,
        title=c.title,
        accent=c.accent,
        # Live overlay: connected accounts show online no matter the stored value.
        status="online" if is_online(c.email) else c.status,
    )


@router.get("", response_model=ContactListOut, summary="List contacts")
def list_contacts(db: DbSession, current_user: CurrentUser) -> ContactListOut:
    rows = ContactRepository(db).get_for_owner(current_user.id)
    items = [_serialize(c) for c in rows]
    return ContactListOut(items=items, total=len(items))


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED, summary="Add a contact")
def create_contact(payload: ContactCreate, db: DbSession, current_user: CurrentUser) -> ContactOut:
    repo = ContactRepository(db)
    contact = Contact(
        owner_id=current_user.id,
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        title=(payload.title or "").strip() or None,
        status="offline",
        accent=random.choice(_ACCENTS),
    )
    repo.create(contact)
    return _serialize(contact)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a contact")
def delete_contact(contact_id: str, db: DbSession, current_user: CurrentUser) -> Response:
    repo = ContactRepository(db)
    contact = repo.get_owned(contact_id, current_user.id)
    if contact is None:
        raise NotFoundException("Contact", contact_id)
    repo.delete(contact)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
