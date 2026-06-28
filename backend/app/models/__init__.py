"""
app.models — ORM model registry.

Every model must be imported here so that:
- SQLAlchemy's Base.metadata knows about all tables.
- Alembic autogenerate discovers the full schema when it imports this module.

Import order matters for SQLAlchemy's mapper registry:
1. Base classes and enums (no dependencies)
2. User (no FK dependencies)
3. Meeting (FK → User)
4. Participant (FK → Meeting + User)
"""

from app.models.enums import MeetingStatus, ParticipantRole
from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant

__all__: list[str] = [
    "MeetingStatus",
    "ParticipantRole",
    "User",
    "Meeting",
    "Participant",
]
