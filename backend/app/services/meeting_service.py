from __future__ import annotations

import logging
import secrets
import string
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictException
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
