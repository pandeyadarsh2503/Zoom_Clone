"""Thin dispatch — validate an inbound envelope and route it to one RoomManager call."""
from __future__ import annotations

import logging
from typing import Any

from app.websocket.events import EventType, InboundEnvelope
from app.websocket.room_manager import RoomManager

logger = logging.getLogger(__name__)


async def dispatch(rooms: RoomManager, code: str, pid: str, raw: dict[str, Any]) -> None:
    try:
        env = InboundEnvelope.model_validate(raw)
    except Exception:
        return
    t, d = env.type, env.data

    if t is EventType.CHAT:
        await rooms.chat(code, pid, d.get("text", ""))
    elif t is EventType.DRAW:
        await rooms.draw(code, pid, d.get("stroke", {}))
    elif t is EventType.CLEAR_BOARD:
        await rooms.clear_board(code, pid)
    elif t is EventType.BREAKOUT:
        await rooms.breakout(code, pid, d.get("rooms"))
    elif t is EventType.BREAKOUT_END:
        await rooms.breakout_end(code, pid)
    elif t is EventType.MEDIA_STATE:
        await rooms.set_media(code, pid, d.get("kind", ""), bool(d.get("enabled", False)))
    elif t is EventType.HAND:
        await rooms.set_hand(code, pid, bool(d.get("raised", False)))
    elif t is EventType.PERMISSIONS:
        await rooms.set_permissions(code, pid, d)
    elif t is EventType.RENAME:
        await rooms.rename(code, pid, d.get("name", ""))
    elif t is EventType.LOCK:
        await rooms.set_lock(code, pid, bool(d.get("locked", False)))
    # PING is a keepalive no-op.
