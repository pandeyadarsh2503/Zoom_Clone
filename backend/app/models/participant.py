from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ParticipantRole

if TYPE_CHECKING:
    from app.models.meeting import Meeting
    from app.models.user import User


class Participant(Base):
    """
    Junction table linking a User to a Meeting with per-session state.

    Schema decisions
    ────────────────
    - Junction table (not a simple M2M): stores rich per-session state
      (role, media toggles, join/leave timestamps) that a pure association
      table cannot hold. This is the correct modelling choice whenever the
      join itself carries meaningful data.

    - UNIQUE (meeting_id, user_id): a user can have exactly one active
      Participant record per meeting. If they leave and rejoin, the service
      layer updates the existing row (`left_at` reset to NULL, `joined_at`
      updated) rather than inserting a duplicate. This simplifies queries
      ("who is in the room right now?" = WHERE left_at IS NULL).

    - `role` ENUM: validated at the column level by a CHECK constraint
      (via native_enum=False). Service layer enforces promotion rules
      (only HOST can promote to COHOST).

    - `joined_at` NOT NULL, `left_at` nullable: presence semantics.
      `left_at IS NULL` → currently in the room.
      `left_at IS NOT NULL` → has left; `ended_at > joined_at` enforced
      by CHECK constraint.

    - Boolean media-state columns (is_muted, is_video_off, is_screen_sharing):
      denormalised here for O(1) reads. WebSocket events update these in
      real-time via the service layer. Storing them in the DB provides
      persistence across reconnects (client rejoins with same mute state).

    - `ON DELETE CASCADE` on both FKs: removing a user or meeting cleans
      up all associated participant rows automatically.

    Indexes
    ───────
    - ix_participants_meeting_id → "all participants in this room" (O(1) per meeting)
    - ix_participants_user_id    → "all meetings this user attended" (history view)
    The UNIQUE constraint (meeting_id, user_id) creates an implicit index
    that doubles as the covering index for membership checks.
    """

    __tablename__ = "participants"

    __table_args__ = (
        # ── Integrity constraints ───────────────────────────────
        UniqueConstraint(
            "meeting_id",
            "user_id",
            name="uq_participant_meeting_user",
        ),
        CheckConstraint(
            "left_at IS NULL OR left_at >= joined_at",
            name="ck_participant_left_after_joined",
        ),
        # ── Performance indexes ─────────────────────────────────
        Index("ix_participants_meeting_id", "meeting_id"),
        Index("ix_participants_user_id", "user_id"),
    )

    # ── Primary key ──────────────────────────────────────────────
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # ── Foreign keys ─────────────────────────────────────────────
    meeting_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        doc="FK to the parent meeting. CASCADE: deleting a meeting removes its participants.",
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        doc="FK to the participating user. CASCADE: deleting a user removes their participation history.",
    )

    # ── Role ──────────────────────────────────────────────────────
    role: Mapped[ParticipantRole] = mapped_column(
        SAEnum(
            ParticipantRole,
            name="participant_role_enum",
            native_enum=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        nullable=False,
        default=ParticipantRole.ATTENDEE,
        doc="Privilege level within the meeting room.",
    )

    # ── Temporal ─────────────────────────────────────────────────
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        doc="Timestamp of the most recent join event.",
    )
    left_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp of the most recent leave event. NULL means currently in the room.",
    )

    # ── Real-time media state ─────────────────────────────────────
    # Stored in the DB so reconnecting clients restore their previous state
    # without a round-trip to the WebSocket hub.
    is_muted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="True when the participant's microphone is muted.",
    )
    is_video_off: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="True when the participant's camera is disabled.",
    )
    is_screen_sharing: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="True when the participant is broadcasting their screen.",
    )

    # ── Relationships ─────────────────────────────────────────────
    meeting: Mapped[Meeting] = relationship(
        "Meeting",
        back_populates="participants",
    )
    user: Mapped[User] = relationship(
        "User",
        back_populates="participations",
    )

    def __repr__(self) -> str:
        return (
            f"<Participant meeting={self.meeting_id!r} "
            f"user={self.user_id!r} role={self.role!r}>"
        )
