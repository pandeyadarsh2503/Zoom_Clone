from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user",
    description="Returns the profile of the active (default) user.",
)
def get_me(current_user: CurrentUser) -> User:
    return current_user


@router.patch(
    "/me",
    response_model=UserOut,
    summary="Update current user",
    description="Partially updates display_name and/or avatar_url. Absent fields are left unchanged.",
)
def update_me(payload: UserUpdate, db: DbSession, current_user: CurrentUser) -> User:
    # Only touch fields the client actually sent. avatar_url may be sent as
    # null to *clear* the photo, so distinguish "absent" from "explicit null".
    sent = payload.model_fields_set
    if "display_name" in sent and payload.display_name is not None:
        current_user.display_name = payload.display_name
    if "avatar_url" in sent:
        current_user.avatar_url = payload.avatar_url

    repo = UserRepository(db)
    return repo.save(current_user)
