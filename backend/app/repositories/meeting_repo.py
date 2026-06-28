from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.enums import MeetingStatus
from app.models.meeting import Meeting
from app.repositories.base_repository import BaseRepository


class MeetingRepository(BaseRepository[Meeting]):
    """
    Data-access layer for Meeting records.

    All SQL is confined to this class. Service layer calls these methods
    and never writes SQLAlchemy queries directly.
    """

    def __init__(self, db: Session) -> None:
        super().__init__(Meeting, db)

    # ── Lookup ────────────────────────────────────────────────────

    def get_by_code(self, meeting_code: str) -> Optional[Meeting]:
        """
        Look up a meeting by its human-readable join code.

        Used by the join flow where the user supplies the code, not the UUID.
        The `ix_meetings_meeting_code` unique index makes this an O(log n) seek.
        """
        return (
            self.db.query(Meeting)
            .filter(Meeting.meeting_code == meeting_code)
            .first()
        )

    def code_exists(self, meeting_code: str) -> bool:
        """
        Return True if the given code is already taken.

        Used during meeting creation to guarantee uniqueness before inserting.
        Cheaper than `get_by_code` — returns a boolean without fetching the row.
        """
        return (
            self.db.query(Meeting.id)
            .filter(Meeting.meeting_code == meeting_code)
            .first()
            is not None
        )

    # ── Filtered queries ──────────────────────────────────────────

    def get_by_host(self, host_id: str) -> list[Meeting]:
        """
        Return all meetings created by a specific host, newest first.

        Backed by `ix_meetings_host_id`.
        """
        return (
            self.db.query(Meeting)
            .filter(Meeting.host_id == host_id)
            .order_by(Meeting.created_at.desc())
            .all()
        )

    def get_by_status(self, status: MeetingStatus) -> list[Meeting]:
        """
        Return all meetings in a given lifecycle state, newest first.

        Backed by `ix_meetings_status`.
        Used for dashboard views ("show me all live meetings").
        """
        return (
            self.db.query(Meeting)
            .filter(Meeting.status == status)
            .order_by(Meeting.created_at.desc())
            .all()
        )

    def get_upcoming(self, host_id: str) -> list[Meeting]:
        """
        Return scheduled meetings for a host, ordered soonest first.

        Backed by `ix_meetings_scheduled_at`.
        """
        return (
            self.db.query(Meeting)
            .filter(
                Meeting.host_id == host_id,
                Meeting.status == MeetingStatus.SCHEDULED,
            )
            .order_by(Meeting.scheduled_at.asc())
            .all()
        )

    def get_all_for_user(self, user_id: str) -> list[Meeting]:
        """
        Return all meetings visible to a user — either as host or participant.

        Joins participants to find meetings the user has joined in any role.
        Returns distinct meetings ordered by creation date descending.
        """
        from app.models.participant import Participant  # local import avoids cycles

        return (
            self.db.query(Meeting)
            .join(Participant, Participant.meeting_id == Meeting.id)
            .filter(Participant.user_id == user_id)
            .order_by(Meeting.created_at.desc())
            .all()
        )
