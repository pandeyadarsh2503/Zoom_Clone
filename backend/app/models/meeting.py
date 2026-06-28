from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MeetingStatus

if TYPE_CHECKING:
    from app.models.participant import Participant
    from app.models.user import User


class Meeting(Base):
    """
    Represents a video meeting session.

    Schema decisions
    ────────────────
    - UUID primary key: safe for URLs, globally unique, no sequential
      enumeration risk.

    - `meeting_code` (VARCHAR 16, UNIQUE): the human-readable join key
      surfaced to users ("abc-defg-hij"). Decoupled from the PK so it can
      be regenerated (e.g. after a security incident) without touching any
      FK references. Stored separately from `id` to preserve referential
      integrity while allowing code rotation.

    - `host_id` FK: denormalised shortcut that allows "who is the host?"
      queries without joining `participants`. The host also has a Participant
      row with role=HOST — the two are kept in sync at the service layer.

    - `status` ENUM: drives the meeting lifecycle state machine at the
      application layer. Stored as VARCHAR in SQLite (native ENUM in PG).
      `native_enum=False` adds an explicit CHECK constraint so SQLite also
      rejects invalid values.

    - Nullable timestamp trinity (`scheduled_at`, `started_at`, `ended_at`):
        • `scheduled_at IS NULL` → instant/ad-hoc meeting.
        • `started_at IS NULL` → meeting hasn't begun yet.
        • `ended_at IS NULL`   → meeting is ongoing.
      CHECK constraints enforce temporal ordering.

    - `max_participants` > 0 enforced by CHECK constraint.

    Indexes
    ───────
    - ix_meetings_host_id     → "all meetings I host" query (dashboard)
    - ix_meetings_status      → filtering active/upcoming meetings
    - ix_meetings_scheduled_at → sorting upcoming meetings
    - ix_meetings_created_at  → default sort order (newest first)
    The UNIQUE index on `meeting_code` is created implicitly by the UNIQUE
    constraint on the column.
    """

    __tablename__ = "meetings"

    __table_args__ = (
        # ── Temporal ordering constraints ───────────────────────
        CheckConstraint(
            "started_at IS NULL OR scheduled_at IS NULL OR started_at >= scheduled_at",
            name="ck_meeting_started_after_scheduled",
        ),
        CheckConstraint(
            "ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at",
            name="ck_meeting_ended_after_started",
        ),
        # ── Business rule constraints ───────────────────────────
        CheckConstraint(
            "max_participants > 0",
            name="ck_meeting_max_participants_positive",
        ),
        # ── Performance indexes ─────────────────────────────────
        Index("ix_meetings_host_id", "host_id"),
        Index("ix_meetings_status", "status"),
        Index("ix_meetings_scheduled_at", "scheduled_at"),
        Index("ix_meetings_created_at", "created_at"),
    )

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # ── Ownership ────────────────────────────────────────────────
    host_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        doc=(
            "FK to the User who created this meeting. "
            "ON DELETE CASCADE: deleting the user removes all their meetings."
        ),
    )

    # ── Identity ─────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Display title shown in meeting cards and browser tabs.",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        doc="Optional free-text description or agenda.",
    )
    meeting_code: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        unique=True,
        index=True,
        doc=(
            "Human-readable join key (e.g. 'abc-defg-hij'). "
            "Surfaced in share links; decoupled from PK so it can be rotated."
        ),
    )

    # ── Lifecycle ────────────────────────────────────────────────
    status: Mapped[MeetingStatus] = mapped_column(
        SAEnum(
            MeetingStatus,
            name="meeting_status_enum",
            native_enum=False,   # VARCHAR + CHECK → works on SQLite and PG alike.
            values_callable=lambda e: [x.value for x in e],
        ),
        nullable=False,
        default=MeetingStatus.SCHEDULED,
        doc="Current lifecycle state. Transitions enforced by MeetingService.",
    )

    # ── Temporal ─────────────────────────────────────────────────
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Planned start time. NULL for instant (ad-hoc) meetings.",
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Actual start time. Set when host clicks 'Start'.",
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Actual end time. Set when host clicks 'End for All'.",
    )

    # ── Configuration ─────────────────────────────────────────────
    max_participants: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=100,
        doc="Capacity cap. Enforced at join time by MeetingService.",
    )

    # ── Audit timestamps ─────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships ─────────────────────────────────────────────
    host: Mapped[User] = relationship(
        "User",
        back_populates="hosted_meetings",
        foreign_keys="[Meeting.host_id]",
        doc="The User who owns this meeting.",
    )
    participants: Mapped[list[Participant]] = relationship(
        "Participant",
        back_populates="meeting",
        cascade="all, delete-orphan",
        doc=(
            "All Participant rows for this meeting. "
            "cascade='all, delete-orphan' ensures participants are removed "
            "when the meeting is deleted."
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Meeting id={self.id!r} code={self.meeting_code!r} "
            f"status={self.status!r}>"
        )
