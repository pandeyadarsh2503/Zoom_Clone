from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MeetingStatus


class MeetingBase(BaseModel):
    """Fields shared between create and response schemas."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=4000)
    scheduled_at: Optional[datetime] = None
    max_participants: int = Field(default=100, ge=1, le=1000)


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
