from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.models.enums import MeetingStatus


def _as_utc_iso(dt: Optional[datetime]) -> Optional[str]:
    """
    Serialize a datetime as a UTC ISO string with an explicit offset.

    Naive values (e.g. from SQLite) are assumed to be UTC; aware values
    (e.g. Postgres timestamptz) are converted to UTC. This guarantees the
    frontend always receives an unambiguous instant to render in local time.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


class MeetingBase(BaseModel):
    """Fields shared between create and response schemas."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    scheduled_at: Optional[datetime] = None
    max_participants: int = Field(default=100, ge=1, le=1000)
    duration_minutes: int = Field(default=30, ge=5, le=1440)
    # Scheduling options (returned on the meeting representation).
    passcode: Optional[str] = Field(default=None, max_length=10)
    waiting_room: bool = False
    recurrence: Optional[str] = None
    invitees: Optional[str] = None  # raw comma-separated on output
    host_video: bool = True
    participant_video: bool = True
    join_before_host: bool = True


class ScheduledMeetingCreate(BaseModel):
    """
    POST /meetings — body for scheduling a future meeting.

    `scheduled_at` is required (unlike an instant meeting) and is the combined
    date + time. `meeting_code` / invite link are generated server-side.
    """

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    scheduled_at: datetime
    duration_minutes: int = Field(default=30, ge=5, le=1440)
    passcode: Optional[str] = Field(default=None, max_length=10)
    waiting_room: bool = False
    recurrence: Optional[str] = Field(default=None, pattern="^(daily|weekly|monthly)$")
    invitees: Optional[list[str]] = None
    host_video: bool = True
    participant_video: bool = True
    join_before_host: bool = True


class MeetingCreate(MeetingBase):
    """
    POST /meetings — body schema.

    `meeting_code` is generated server-side (not accepted from the client)
    so it is absent here. The service layer is the single source of truth
    for code generation.
    """

    pass


class MeetingUpdate(BaseModel):
    """
    PATCH /meetings/{id} — all fields optional.

    Only fields explicitly present in the request body are applied.
    Status transitions are handled by dedicated action endpoints
    (e.g. POST /meetings/{id}/start) rather than allowing arbitrary
    PATCH of the status field — this prevents invalid state jumps.
    """

    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    scheduled_at: Optional[datetime] = None
    max_participants: Optional[int] = Field(default=None, ge=1, le=1000)
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=1440)
    passcode: Optional[str] = Field(default=None, max_length=10)
    waiting_room: Optional[bool] = None
    recurrence: Optional[str] = Field(default=None, pattern="^(daily|weekly|monthly)?$")
    invitees: Optional[list[str]] = None
    host_video: Optional[bool] = None
    participant_video: Optional[bool] = None
    join_before_host: Optional[bool] = None


class MeetingOut(MeetingBase):
    """
    API response — full meeting representation.

    `from_attributes=True` enables constructing from a SQLAlchemy ORM
    instance directly: `MeetingOut.model_validate(orm_obj)`.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    host_id: str
    meeting_code: str
    status: MeetingStatus
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Emit every datetime as a UTC ISO string with offset (see _as_utc_iso).
    @field_serializer("scheduled_at", "started_at", "ended_at", "created_at", "updated_at", when_used="json")
    def _serialize_dts(self, dt: Optional[datetime]) -> Optional[str]:
        return _as_utc_iso(dt)


class MeetingListOut(BaseModel):
    """Paginated list wrapper — extends to cursor/page-based pagination in future phases."""

    model_config = ConfigDict(from_attributes=True)

    items: list[MeetingOut]
    total: int


class InstantMeetingResponse(MeetingOut):
    """
    Response for POST /meetings/instant.

    Extends the full meeting representation with a ready-to-share `invite_url`
    so the client can redirect to (and share) the room without reconstructing
    the link itself.
    """

    invite_url: str


class JoinMeetingRequest(BaseModel):
    """
    POST /meetings/join — body schema.

    `meeting_code` accepts either a bare join code ("abc-defg-hij") or a full
    invite link ("http://.../room/abc-defg-hij"); the service normalises it.
    `display_name` is the name the joiner wishes to appear as.
    """

    meeting_code: str = Field(..., min_length=1, max_length=300)
    display_name: str = Field(..., min_length=1, max_length=100)


class JoinMeetingResponse(MeetingOut):
    """Response for POST /meetings/join — the joined meeting plus its invite URL."""

    invite_url: str


class MeetingDetailResponse(MeetingOut):
    """
    Single-meeting response (create / fetch / update of a scheduled meeting).

    Includes the auto-generated `invite_url` so the scheduling UI can show and
    share the link immediately.
    """

    invite_url: str
