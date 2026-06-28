"""
WebSocket endpoint — live presence, chat, whiteboard, breakout.

    /api/v1/ws/meetings/{meeting_code}?name=<display_name>&pid=<participant_id?>

Validates the meeting exists, owns accept/identity/receive-loop/disconnect, and
delegates every frame to the dispatch layer.
"""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.meeting_repo import MeetingRepository
from app.websocket import connection_manager, room_manager
from app.websocket.connection import Connection
from app.websocket.events import error
from app.websocket.handlers import dispatch

logger = logging.getLogger(__name__)

router = APIRouter()


def _meeting_exists(code: str) -> bool:
    db = SessionLocal()
    try:
        return MeetingRepository(db).code_exists(code)
    finally:
        db.close()


def _authed_name(token: str) -> str | None:
    """Validate the WS token (passed via query param) → the user's display name."""
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    db = SessionLocal()
    try:
        user = db.get(User, payload["sub"])
        return user.display_name if user else None
    finally:
        db.close()


@router.websocket("/ws/meetings/{meeting_code}")
async def meeting_socket(websocket: WebSocket, meeting_code: str) -> None:
    await websocket.accept()

    name = _authed_name(websocket.query_params.get("token") or "")
    if name is None:
        await websocket.send_json(error("UNAUTHENTICATED", "Sign in to join."))
        await websocket.close(4401)
        return

    if not _meeting_exists(meeting_code):
        await websocket.send_json(error("MEETING_NOT_FOUND", "This meeting does not exist."))
        await websocket.close(4404)
        return

    pid = (websocket.query_params.get("pid") or "").strip() or uuid.uuid4().hex

    conn = Connection(participant_id=pid, meeting_code=meeting_code, websocket=websocket)
    await connection_manager.register(conn)
    await room_manager.join(meeting_code, pid, name)
    logger.info("ws joined %s (%s)", meeting_code, pid)

    try:
        while True:
            raw = await websocket.receive_json()
            await dispatch(room_manager, meeting_code, pid, raw)
    except WebSocketDisconnect:
        pass
    except Exception as exc:  # pragma: no cover
        logger.warning("ws error %s: %s", pid, exc)
    finally:
        await room_manager.leave(meeting_code, pid)
        await connection_manager.unregister(pid)
