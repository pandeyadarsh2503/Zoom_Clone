from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.enums import ParticipantRole
from app.schemas.user import UserOut


class ParticipantBase(BaseModel):
    """Shared fields."""

    role: ParticipantRole = ParticipantRole.ATTENDEE
    is_muted: bool = False
    is_video_off: bool = False
    is_screen_sharing: bool = False


class ParticipantOut(ParticipantBase):
    """
    API response for a single participant row.

    Returned by GET /meetings/{id}/participants.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    user_id: str
    joined_at: datetime
    left_at: Optional[datetime] = None


class ParticipantWithUser(ParticipantOut):
    """
    Participant enriched with user profile data.

    Used in the in-room participant list where avatar and display name
    must be shown without a separate API call for each participant.

    Design note: embedding user data here is intentional denormalisation
    for the room view. It avoids N+1 queries — a single JOIN fetches
    all participants with their user profiles.
    """

    user: UserOut


class MediaStateUpdate(BaseModel):
    """
    WebSocket event payload for toggling media state.

    Sent by clients to broadcast their current camera/microphone state.
    All fields are optional so clients only send the field that changed.
    """

    is_muted: Optional[bool] = None
    is_video_off: Optional[bool] = None
    is_screen_sharing: Optional[bool] = None
