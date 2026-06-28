from __future__ import annotations

import logging
import secrets
import string
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnprocessableException,
)
from app.models.enums import MeetingStatus, ParticipantRole
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.user import User
from app.repositories.meeting_repo import MeetingRepository
from app.repositories.participant_repo import ParticipantRepository

logger = logging.getLogger(__name__)

# Lowercase alphanumerics — unambiguous, URL-safe, matches the seeded code style.
_CODE_ALPHABET = string.ascii_lowercase + string.digits
_CODE_GENERATION_ATTEMPTS = 10


class MeetingService:
    """
    Business logic for the meeting lifecycle.

    The service owns all rules a route handler should not know about: unique
    code generation, host-participant bookkeeping, and invite-link assembly.
    Routes call the service; the service calls repositories. SQL stays in the
    repositories, orchestration stays here.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.meetings = MeetingRepository(db)
        self.participants = ParticipantRepository(db)

    # ── Code generation ───────────────────────────────────────────

    def _generate_unique_code(self) -> str:
        """
        Produce a human-readable join code (e.g. "abc-defg-hij") that is not
        already taken. Retries a bounded number of times before giving up so a
        pathological collision streak can never hang the request.
        """
        def segment(length: int) -> str:
            return "".join(secrets.choice(_CODE_ALPHABET) for _ in range(length))

        for _ in range(_CODE_GENERATION_ATTEMPTS):
            code = f"{segment(3)}-{segment(4)}-{segment(3)}"
            if not self.meetings.code_exists(code):
                return code

        raise ConflictException("Could not generate a unique meeting code. Please retry.")

    # ── Invite link ───────────────────────────────────────────────

    def build_invite_url(self, meeting_code: str) -> str:
        """Assemble the shareable room URL from the configured frontend base."""
        base = settings.FRONTEND_URL.rstrip("/")
        return f"{base}/room/{meeting_code}"

    @staticmethod
    def normalize_code(raw: str) -> str:
        """
        Reduce a raw join input to a bare meeting code.

        Accepts a plain code ("abc-defg-hij") or a full invite link
        ("https://host/room/abc-defg-hij?x=1"); returns the lowercase code.
        """
        value = raw.strip()
        if "/room/" in value:
            value = value.split("/room/", 1)[1]
        # Drop any query string / fragment and surrounding slashes.
        value = value.split("?", 1)[0].split("#", 1)[0].strip().strip("/")
        return value.lower()

    # ── Scheduled meetings (CRUD) ─────────────────────────────────

    def create_scheduled_meeting(
        self,
        host: User,
        *,
        title: str,
        description: str | None,
        scheduled_at: datetime,
        duration_minutes: int,
    ) -> Meeting:
        """
        Create a SCHEDULED meeting for a future time.

        Generates a unique join code (→ invite link), persists the meeting, and
        adds the host's Participant row so it surfaces in the host's dashboard.
        """
        code = self._generate_unique_code()
        meeting = Meeting(
            host_id=host.id,
            title=title.strip(),
            description=(description or "").strip() or None,
            meeting_code=code,
            status=MeetingStatus.SCHEDULED,
            scheduled_at=scheduled_at,
            started_at=None,
            ended_at=None,
            max_participants=100,
            duration_minutes=duration_minutes,
        )
        self.db.add(meeting)
        self.db.flush()

        self.db.add(
            Participant(
                meeting_id=meeting.id,
                user_id=host.id,
                role=ParticipantRole.HOST,
                joined_at=datetime.now(timezone.utc),
                left_at=datetime.now(timezone.utc),  # not in the room until it starts
            )
        )
        self.db.commit()
        self.db.refresh(meeting)
        logger.info("Scheduled meeting %s (code=%s) by user %s", meeting.id, code, host.id)
        return meeting

    def get_meeting(self, meeting_id: str) -> Meeting:
        """Fetch a meeting by id, or raise 404."""
        meeting = self.meetings.get_by_id(meeting_id)
        if meeting is None:
            raise NotFoundException("Meeting", meeting_id)
        return meeting

    def update_scheduled_meeting(
        self,
        meeting_id: str,
        *,
        title: str | None = None,
        description: str | None = None,
        scheduled_at: datetime | None = None,
        duration_minutes: int | None = None,
    ) -> Meeting:
        """
        Update an editable (scheduled) meeting. Only fields provided are changed.

        Editing is restricted to SCHEDULED meetings — a live/ended/cancelled
        meeting cannot be rescheduled.
        """
        meeting = self.get_meeting(meeting_id)
        if meeting.status != MeetingStatus.SCHEDULED:
            raise UnprocessableException("Only scheduled meetings can be edited.")

        if title is not None:
            meeting.title = title.strip()
        if description is not None:
            meeting.description = description.strip() or None
        if scheduled_at is not None:
            meeting.scheduled_at = scheduled_at
        if duration_minutes is not None:
            meeting.duration_minutes = duration_minutes

        self.db.commit()
        self.db.refresh(meeting)
        logger.info("Updated scheduled meeting %s", meeting_id)
        return meeting

    def delete_meeting(self, meeting_id: str) -> None:
        """Delete a meeting (cascades to its participants)."""
        meeting = self.get_meeting(meeting_id)
        self.db.delete(meeting)
        self.db.commit()
        logger.info("Deleted meeting %s", meeting_id)

    # ── Join ──────────────────────────────────────────────────────

    def join_meeting(self, identifier: str, display_name: str, user: User) -> Meeting:
        """
        Join an existing meeting by code or invite link.

        Validation:
          - the meeting must exist (else 404),
          - it must still be active — not ended or cancelled (else 422),
          - it must have capacity for a new joiner (else 422).

        On success the caller's display name is applied, their Participant row
        is created (or revived if they previously left), and the meeting is
        returned so the client can redirect into the room.
        """
        code = self.normalize_code(identifier)
        if not code:
            raise UnprocessableException("Enter a meeting ID or invite link.")

        meeting = self.meetings.get_by_code(code)
        if meeting is None:
            raise NotFoundException("Meeting", code)

        if meeting.status in (MeetingStatus.ENDED, MeetingStatus.CANCELLED):
            raise UnprocessableException("This meeting is no longer active.")

        existing = self.participants.get_by_meeting_and_user(meeting.id, user.id)
        if existing is None and self.participants.count_active(meeting.id) >= meeting.max_participants:
            raise UnprocessableException("This meeting is full.")

        # Apply the joiner's chosen display name.
        name = display_name.strip()
        if name and user.display_name != name:
            user.display_name = name

        now = datetime.now(timezone.utc)
        if existing is not None:
            # Revive a prior participation (rejoin) rather than duplicating.
            existing.left_at = None
            existing.joined_at = now
        else:
            self.db.add(
                Participant(
                    meeting_id=meeting.id,
                    user_id=user.id,
                    role=ParticipantRole.ATTENDEE,
                    joined_at=now,
                )
            )

        self.db.commit()
        self.db.refresh(meeting)

        logger.info("User %s joined meeting %s (code=%s)", user.id, meeting.id, meeting.meeting_code)
        return meeting

    # ── Instant meeting ───────────────────────────────────────────

    def create_instant_meeting(self, host: User) -> Meeting:
        """
        Start an instant meeting: a meeting that is LIVE from creation.

        Steps:
          1. Reserve a unique join code.
          2. Insert the LIVE meeting owned by `host`.
          3. Insert the host's Participant row (role=HOST) so the meeting is
             visible in the host's dashboard list, which joins on participants.

        Both inserts are committed in a single transaction — if either fails,
        nothing is persisted.
        """
        now = datetime.now(timezone.utc)
        code = self._generate_unique_code()

        meeting = Meeting(
            host_id=host.id,
            title=f"{host.display_name}'s Instant Meeting",
            description="Instant meeting started from the dashboard.",
            meeting_code=code,
            status=MeetingStatus.LIVE,
            scheduled_at=None,
            started_at=now,
            ended_at=None,
            max_participants=100,
        )
        self.db.add(meeting)
        self.db.flush()  # populate meeting.id for the participant FK

        host_participant = Participant(
            meeting_id=meeting.id,
            user_id=host.id,
            role=ParticipantRole.HOST,
            joined_at=now,
        )
        self.db.add(host_participant)

        self.db.commit()
        self.db.refresh(meeting)

        logger.info(
            "Instant meeting %s (code=%s) started by user %s",
            meeting.id,
            meeting.meeting_code,
            host.id,
        )
        return meeting
