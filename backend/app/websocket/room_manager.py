"""
RoomManager — live domain state for meetings.

Owns presence (who is actually connected), chat fan-out, whiteboard stroke
relay + persistence (so late joiners see the current board), breakout-room
coordination, and media/hand state. Business rules live here; the ws route and
handlers only route. Delivery goes through :class:`ConnectionManager`.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from app.websocket import events
from app.websocket.events import EventType
from app.websocket.manager import ConnectionManager

logger = logging.getLogger(__name__)

_MAX_STROKES = 5000  # cap board history to keep memory bounded


@dataclass
class Participant:
    id: str
    name: str
    role: str = "attendee"
    is_muted: bool = False
    is_video_off: bool = True
    is_screen_sharing: bool = False
    hand_raised: bool = False
    join_order: int = 0


def _default_permissions() -> dict[str, bool]:
    """Meeting-wide permissions the host can toggle (all on by default)."""
    return {"allow_share": True, "allow_chat": True, "allow_rename": True}


@dataclass
class Room:
    code: str
    participants: dict[str, Participant] = field(default_factory=dict)
    host_id: str | None = None
    board: list[dict[str, Any]] = field(default_factory=list)
    permissions: dict[str, bool] = field(default_factory=_default_permissions)
    locked: bool = False
    _order: int = 0

    def next_order(self) -> int:
        self._order += 1
        return self._order

    def others(self, exclude: str | None = None) -> list[str]:
        return [pid for pid in self.participants if pid != exclude]


class RoomManager:
    def __init__(self, connections: ConnectionManager) -> None:
        self._rooms: dict[str, Room] = {}
        self._conn = connections
        self._lock = asyncio.Lock()

    def _serialize(self, room: Room, p: Participant) -> dict[str, Any]:
        return {
            "id": p.id,
            "name": p.name,
            "role": p.role,
            "is_host": room.host_id == p.id,
            "is_muted": p.is_muted,
            "is_video_off": p.is_video_off,
            "is_screen_sharing": p.is_screen_sharing,
            "hand_raised": p.hand_raised,
            "join_order": p.join_order,
        }

    def _roster(self, room: Room) -> list[dict[str, Any]]:
        ordered = sorted(room.participants.values(), key=lambda p: p.join_order)
        return [self._serialize(room, p) for p in ordered]

    # ── Presence ──────────────────────────────────────────────
    async def join(self, code: str, pid: str, name: str) -> bool:
        """Add a participant. Returns False (rejected) if the room is locked to new joiners."""
        async with self._lock:
            room = self._rooms.setdefault(code, Room(code=code))
            reconnect = pid in room.participants
            # A locked room only accepts people who are already in it (reconnects).
            if not reconnect and room.locked:
                return False
            if reconnect:
                p = room.participants[pid]
            else:
                p = Participant(id=pid, name=name, join_order=room.next_order())
                room.participants[pid] = p
                if room.host_id is None:
                    room.host_id = pid
                    p.role = "host"
            roster = self._roster(room)
            you = self._serialize(room, p)
            others = room.others(exclude=pid)
            board = list(room.board)
            perms = dict(room.permissions)
            locked = room.locked

        await self._conn.unicast(pid, events.build(EventType.ROOM_STATE, you=you, participants=roster, board=board, permissions=perms, locked=locked))
        if not reconnect:
            await self._conn.broadcast(others, events.build(EventType.PARTICIPANT_JOINED, participant=you))
        return True

    async def leave(self, code: str, pid: str) -> None:
        async with self._lock:
            room = self._rooms.get(code)
            if not room or pid not in room.participants:
                return
            del room.participants[pid]
            new_host: str | None = None
            if room.host_id == pid:
                room.host_id = None
                rest = sorted(room.participants.values(), key=lambda p: p.join_order)
                if rest:
                    rest[0].role = "host"
                    room.host_id = new_host = rest[0].id
            others = room.others()
            if not room.participants:
                del self._rooms[code]

        await self._conn.broadcast(others, events.build(EventType.PARTICIPANT_LEFT, participant_id=pid))
        if new_host:
            await self._conn.broadcast(others, events.build(EventType.HOST_CHANGED, host_id=new_host))

    # ── Chat ──────────────────────────────────────────────────
    async def chat(self, code: str, pid: str, text: str) -> None:
        text = (text or "").strip()
        room = self._rooms.get(code)
        if not text or not room or pid not in room.participants:
            return
        # Host can disable participant chat; the host themselves is exempt.
        if not room.permissions.get("allow_chat", True) and room.host_id != pid:
            return
        sender = room.participants[pid]
        await self._conn.broadcast(
            list(room.participants.keys()),
            events.build(
                EventType.CHAT,
                id=f"{pid}-{room.next_order()}",
                sender_id=pid,
                name=sender.name,
                text=text[:2000],
                ts=datetime.now(timezone.utc).isoformat(),
            ),
        )

    # ── Whiteboard ────────────────────────────────────────────
    async def draw(self, code: str, pid: str, stroke: dict[str, Any]) -> None:
        room = self._rooms.get(code)
        if not room or pid not in room.participants or not isinstance(stroke, dict):
            return
        room.board.append(stroke)
        if len(room.board) > _MAX_STROKES:
            del room.board[: len(room.board) - _MAX_STROKES]
        await self._conn.broadcast(room.others(exclude=pid), events.build(EventType.DRAW, stroke=stroke, sender_id=pid))

    async def clear_board(self, code: str, pid: str) -> None:
        room = self._rooms.get(code)
        if not room or pid not in room.participants:
            return
        room.board.clear()
        await self._conn.broadcast(room.others(exclude=pid), events.build(EventType.CLEAR_BOARD))

    # ── Breakout ──────────────────────────────────────────────
    async def breakout(self, code: str, pid: str, rooms: Any) -> None:
        room = self._rooms.get(code)
        if not room or room.host_id != pid:
            return
        await self._conn.broadcast(list(room.participants.keys()), events.build(EventType.BREAKOUT, rooms=rooms))

    async def breakout_end(self, code: str, pid: str) -> None:
        room = self._rooms.get(code)
        if not room or room.host_id != pid:
            return
        await self._conn.broadcast(list(room.participants.keys()), events.build(EventType.BREAKOUT_END))

    # ── Media / hand ──────────────────────────────────────────
    async def set_media(self, code: str, pid: str, kind: str, enabled: bool) -> None:
        room = self._rooms.get(code)
        if not room or pid not in room.participants or kind not in {"audio", "video", "screen"}:
            return
        p = room.participants[pid]
        if kind == "audio":
            p.is_muted = not enabled
        elif kind == "video":
            p.is_video_off = not enabled
        else:  # screen
            p.is_screen_sharing = enabled
        await self._conn.broadcast(list(room.participants.keys()), events.build(EventType.MEDIA_STATE, participant_id=pid, kind=kind, enabled=enabled))

    async def set_hand(self, code: str, pid: str, raised: bool) -> None:
        room = self._rooms.get(code)
        if not room or pid not in room.participants:
            return
        room.participants[pid].hand_raised = raised
        await self._conn.broadcast(list(room.participants.keys()), events.build(EventType.HAND, participant_id=pid, raised=raised))

    # ── Host permissions ──────────────────────────────────────
    async def set_permissions(self, code: str, pid: str, perms: dict[str, Any]) -> None:
        """Host-only. Merge known permission flags and broadcast to everyone."""
        room = self._rooms.get(code)
        if not room or room.host_id != pid or not isinstance(perms, dict):
            return
        for key in ("allow_share", "allow_chat", "allow_rename"):
            if key in perms:
                room.permissions[key] = bool(perms[key])
        await self._conn.broadcast(
            list(room.participants.keys()),
            events.build(EventType.PERMISSIONS, **room.permissions),
        )

    # ── Lock ──────────────────────────────────────────────────
    async def set_lock(self, code: str, pid: str, locked: bool) -> None:
        """Host-only. Lock/unlock the room and tell everyone (gates new joins)."""
        room = self._rooms.get(code)
        if not room or room.host_id != pid:
            return
        room.locked = bool(locked)
        await self._conn.broadcast(
            list(room.participants.keys()),
            events.build(EventType.LOCK_STATE, locked=room.locked),
        )

    # ── Rename ────────────────────────────────────────────────
    async def rename(self, code: str, pid: str, name: str) -> None:
        """Self-rename, gated by the meeting's allow_rename permission (host always may)."""
        room = self._rooms.get(code)
        name = (name or "").strip()[:60]
        if not room or pid not in room.participants or not name:
            return
        if not room.permissions.get("allow_rename", True) and room.host_id != pid:
            return
        room.participants[pid].name = name
        await self._conn.broadcast(
            list(room.participants.keys()),
            events.build(EventType.PARTICIPANT_RENAMED, participant_id=pid, name=name),
        )

    def room_size(self, code: str) -> int:
        r = self._rooms.get(code)
        return len(r.participants) if r else 0
