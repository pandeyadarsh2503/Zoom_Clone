from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.participant import Participant
from app.repositories.base_repository import BaseRepository


class ParticipantRepository(BaseRepository[Participant]):
    """
    Data-access layer for Participant records.

    Presence semantics: `left_at IS NULL` means the participant is currently
    in the room. All "active participant" queries filter on this condition.
    """

    def __init__(self, db: Session) -> None:
        super().__init__(Participant, db)

    # ── Lookup ────────────────────────────────────────────────────

    def get_by_meeting_and_user(
        self, meeting_id: str, user_id: str
    ) -> Optional[Participant]:
        """
        Return the participant record for a specific user in a specific meeting.

        Used by the join flow to determine whether to INSERT or UPDATE.
        Covered by the `uq_participant_meeting_user` unique index.
        """
        return (
            self.db.query(Participant)
            .filter(
                Participant.meeting_id == meeting_id,
                Participant.user_id == user_id,
            )
            .first()
        )

    # ── Room queries ──────────────────────────────────────────────

    def get_active_by_meeting(self, meeting_id: str) -> list[Participant]:
        """
        Return participants currently in the room (`left_at IS NULL`).

        Used to build the live participant list in the room UI.
        Backed by `ix_participants_meeting_id`.
        """
        return (
            self.db.query(Participant)
            .filter(
                Participant.meeting_id == meeting_id,
                Participant.left_at.is_(None),
            )
            .all()
        )

    def get_active_by_meeting_with_users(
        self, meeting_id: str
    ) -> list[Participant]:
        """
        Return active participants with their User profile eagerly loaded.

        Using `joinedload` prevents the N+1 problem: one SQL JOIN fetches
        all participants and their user records in a single round-trip,
        rather than SQLAlchemy lazily issuing one SELECT per participant.
        """
        return (
            self.db.query(Participant)
            .options(joinedload(Participant.user))
            .filter(
                Participant.meeting_id == meeting_id,
                Participant.left_at.is_(None),
            )
            .all()
        )

    def get_all_by_meeting(self, meeting_id: str) -> list[Participant]:
        """
        Return all participant records for a meeting, including those who left.

        Used for the meeting history / post-call summary view.
        """
        return (
            self.db.query(Participant)
            .filter(Participant.meeting_id == meeting_id)
            .order_by(Participant.joined_at.asc())
            .all()
        )

    def get_all_by_user(self, user_id: str) -> list[Participant]:
        """
        Return all meetings a user has participated in, newest first.

        Backed by `ix_participants_user_id`. Used for meeting history page.
        """
        return (
            self.db.query(Participant)
            .filter(Participant.user_id == user_id)
            .order_by(Participant.joined_at.desc())
            .all()
        )

    def count_active(self, meeting_id: str) -> int:
        """
        Return the number of participants currently in the room.

        Used by the join flow to enforce `max_participants` before allowing
        a new joiner. A COUNT query avoids loading full ORM objects.
        """
        return (
            self.db.query(Participant)
            .filter(
                Participant.meeting_id == meeting_id,
                Participant.left_at.is_(None),
            )
            .count()
        )
