from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import users

# Top-level v1 router — include every sub-router here.
# Prefix and tags are set on the individual sub-routers so this aggregator
# stays thin and only concerns itself with composition.
api_router = APIRouter()

api_router.include_router(users.router)
