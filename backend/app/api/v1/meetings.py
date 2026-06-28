from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.models.enums import MeetingStatus
from app.repositories.meeting_repo import MeetingRepository
from app.schemas.meeting import (
    InstantMeetingResponse,
    JoinMeetingRequest,
    JoinMeetingResponse,
    MeetingListOut,
    MeetingOut,
)
from app.services.meeting_service import MeetingService

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get(
    "",
    response_model=MeetingListOut,
    summary="Get meetings for current user",
    description="Returns meetings where the current user is host or participant, with optional status filtering.",
)
def get_meetings(
    db: DbSession,
    current_user: CurrentUser,
    status: Optional[MeetingStatus] = Query(default=None, description="Filter meetings by status"),
) -> dict:
    repo = MeetingRepository(db)
    
    # If a specific status filter is provided
    if status is not None:
        # Get all meetings for this user, then filter by status
        # In a real-world enterprise app with millions of rows, we would query the database with
        # status and user join filters directly. Since our repository already has user-scoped queries,
        # we can filter the query or implement a combined filter.
        # Let's do it clean: filter the user's meetings list by status.
        all_meetings = repo.get_all_for_user(current_user.id)
        filtered = [m for m in all_meetings if m.status == status]
    else:
        filtered = repo.get_all_for_user(current_user.id)

    return {
        "items": filtered,
        "total": len(filtered),
    }


@router.post(
    "/instant",
    response_model=InstantMeetingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start an instant meeting",
    description=(
        "Creates a LIVE meeting hosted by the current user, generates a unique "
        "join code and shareable invite URL, and returns the new meeting."
    ),
)
def create_instant_meeting(db: DbSession, current_user: CurrentUser) -> InstantMeetingResponse:
    service = MeetingService(db)
    meeting = service.create_instant_meeting(current_user)
    invite_url = service.build_invite_url(meeting.meeting_code)
    return InstantMeetingResponse(
        **MeetingOut.model_validate(meeting).model_dump(),
        invite_url=invite_url,
    )


@router.post(
    "/join",
    response_model=JoinMeetingResponse,
    summary="Join a meeting",
    description=(
        "Joins an existing meeting by ID or invite link. Validates that the "
        "meeting exists and is active, records the participant, and returns the "
        "meeting so the client can enter the room."
    ),
)
def join_meeting(
    payload: JoinMeetingRequest, db: DbSession, current_user: CurrentUser
) -> JoinMeetingResponse:
    service = MeetingService(db)
    meeting = service.join_meeting(payload.meeting_code, payload.display_name, current_user)
    invite_url = service.build_invite_url(meeting.meeting_code)
    return JoinMeetingResponse(
        **MeetingOut.model_validate(meeting).model_dump(),
        invite_url=invite_url,
    )
