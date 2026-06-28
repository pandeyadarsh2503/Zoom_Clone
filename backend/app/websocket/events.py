"""
Real-time meeting protocol.

Every frame is an envelope ``{"type": <EventType>, "data": {...}}``. Inbound is
validated with :class:`InboundEnvelope`; outbound is built with ``build``.

This powers live presence, chat, the collaborative whiteboard, breakout-room
coordination, and media/hand state — no WebRTC media here.
"""
from __future__ import annotations

import enum
from typing import Any

from pydantic import BaseModel, Field


class EventType(str, enum.Enum):
    # ── Inbound (client → server) ─────────────────────────────
    CHAT = "chat"                  # {text}
    DRAW = "draw"                  # {stroke}  whiteboard stroke
    CLEAR_BOARD = "clear-board"
    BREAKOUT = "breakout"          # host: {rooms:[{name, members}]}
    BREAKOUT_END = "breakout-end"  # host
    MEDIA_STATE = "media-state"    # {kind, enabled}
    HAND = "hand"                  # {raised}
    PING = "ping"

    # ── Outbound (server → client) ────────────────────────────
    ROOM_STATE = "room-state"      # {you, participants}
    PARTICIPANT_JOINED = "participant-joined"
    PARTICIPANT_LEFT = "participant-left"
    HOST_CHANGED = "host-changed"
    PONG = "pong"
    ERROR = "error"


class InboundEnvelope(BaseModel):
    type: EventType
    data: dict[str, Any] = Field(default_factory=dict)


def build(event: EventType, **data: Any) -> dict[str, Any]:
    return {"type": event.value, "data": data}


def error(code: str, message: str) -> dict[str, Any]:
    return build(EventType.ERROR, code=code, message=message)
