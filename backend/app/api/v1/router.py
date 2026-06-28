from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth
from app.api.v1 import users
from app.api.v1 import meetings
from app.api.v1 import contacts
from app.api.v1 import ws

# Top-level v1 router — include every sub-router here.
# Prefix and tags are set on the individual sub-routers so this aggregator
# stays thin and only concerns itself with composition.
api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(meetings.router)
api_router.include_router(contacts.router)
api_router.include_router(ws.router)
