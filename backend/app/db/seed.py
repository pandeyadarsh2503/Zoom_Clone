from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.enums import MeetingStatus, ParticipantRole
from app.models.meeting import Meeting
from app.models.participant import Participant
from app.models.user import User

logger = logging.getLogger(__name__)

# ── Sample meeting definitions ─────────────────────────────────────────────
# Each entry represents one realistic scenario that exercises a distinct
# lifecycle state.  The fixed meeting_codes make the seed idempotent — we
# check for one of these codes before inserting.

_SEED_MEETING_CODE = "abc-defg-hij1"   # Sentinel used to detect "already seeded".

_NOW = None   # Resolved at runtime so timestamps are always relative to now.


def _now() -> datetime:
    return datetime.now(timezone.utc)


def seed_sample_data(db: Session) -> None:
    """
    Seed four sample meetings covering every lifecycle status.

    Idempotent — checks for the sentinel meeting_code before inserting.
    Logs a summary on first run; logs a one-liner skip on subsequent runs.

    Meeting scenarios
    ─────────────────
    1. LIVE        — "Weekly Team Standup"   (started 15 min ago)
    2. SCHEDULED   — "Q3 Product Planning"   (starts tomorrow)
    3. ENDED       — "Architecture Review"   (ran for 1 h yesterday)
    4. CANCELLED   — "Onboarding Session"    (was planned, never ran)

    Each meeting has the default user as a HOST participant so the
    foreign-key and UNIQUE constraints are exercised.
    """
    # Idempotency check
    if db.query(Meeting).filter(Meeting.meeting_code == _SEED_MEETING_CODE).first():
        logger.info("Sample data already seeded — skipping.")
        return

    user: User | None = db.query(User).first()
    if user is None:
        logger.warning("No default user found; skipping sample data seed.")
        return

    now = _now()

    meetings: list[dict] = [
        {
            "meeting_code": _SEED_MEETING_CODE,
            "title": "Weekly Team Standup",
            "description": (
                "Daily sync to align on sprint progress, surface blockers, "
                "and coordinate cross-team dependencies."
            ),
            "status": MeetingStatus.LIVE,
            "scheduled_at": now - timedelta(minutes=30),
            "started_at": now - timedelta(minutes=15),
            "ended_at": None,
            "participant_left_at": None,          # host is still in the call
        },
        {
            "meeting_code": "xyz-qrst-uvw2",
            "title": "Q3 Product Planning",
            "description": (
                "Define the feature roadmap and technical priorities "
                "for the upcoming quarter."
            ),
            "status": MeetingStatus.SCHEDULED,
            "scheduled_at": now + timedelta(days=1),
            "started_at": None,
            "ended_at": None,
            "participant_left_at": None,
        },
        {
            "meeting_code": "lmn-opqr-stu3",
            "title": "Architecture Review",
            "description": (
                "Deep-dive into the proposed WebRTC signalling layer "
                "and SFU migration plan."
            ),
            "status": MeetingStatus.ENDED,
            "scheduled_at": now - timedelta(hours=3),
            "started_at": now - timedelta(hours=2),
            "ended_at": now - timedelta(hours=1),
            "participant_left_at": now - timedelta(hours=1),  # left when meeting ended
        },
        {
            "meeting_code": "vwx-yzab-cde4",
            "title": "New Hire Onboarding",
            "description": (
                "Orientation for new engineering team members joining Q3. "
                "Covers codebase walkthrough, process, and tooling."
            ),
            "status": MeetingStatus.CANCELLED,
            "scheduled_at": now + timedelta(days=3),
            "started_at": None,
            "ended_at": None,
            "participant_left_at": None,
        },
    ]

    seeded_count = 0
    for data in meetings:
        meeting = Meeting(
            host_id=user.id,
            title=data["title"],
            description=data["description"],
            meeting_code=data["meeting_code"],
            status=data["status"],
            scheduled_at=data["scheduled_at"],
            started_at=data["started_at"],
            ended_at=data["ended_at"],
            max_participants=100,
        )
        db.add(meeting)
        db.flush()   # Populate meeting.id so the FK below resolves.

        # Add the default user as HOST participant.
        # Every meeting must have a host participant — this satisfies the
        # UNIQUE (meeting_id, user_id) constraint for the initial join.
        participant_joined_at = data["started_at"] or data["scheduled_at"] or now
        participant = Participant(
            meeting_id=meeting.id,
            user_id=user.id,
            role=ParticipantRole.HOST,
            joined_at=participant_joined_at,
            left_at=data["participant_left_at"],
            is_muted=False,
            is_video_off=False,
            is_screen_sharing=False,
        )
        db.add(participant)
        seeded_count += 1

        logger.debug(
            "Staged meeting %r [%s] for user %s",
            data["title"],
            data["status"],
            user.id,
        )

    db.commit()
    logger.info(
        "Sample data seeded: %d meetings with host participant records.",
        seeded_count,
    )
