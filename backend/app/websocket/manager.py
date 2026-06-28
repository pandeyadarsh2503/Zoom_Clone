"""ConnectionManager — transport registry. unicast + failure-tolerant broadcast."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Iterable

from app.websocket.connection import Connection

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, Connection] = {}
        self._lock = asyncio.Lock()

    async def register(self, conn: Connection) -> None:
        async with self._lock:
            self._connections[conn.participant_id] = conn

    async def unregister(self, participant_id: str) -> None:
        async with self._lock:
            self._connections.pop(participant_id, None)

    async def unicast(self, participant_id: str, message: dict[str, Any]) -> None:
        conn = self._connections.get(participant_id)
        if conn:
            await conn.send(message)

    async def broadcast(self, participant_ids: Iterable[str], message: dict[str, Any]) -> None:
        targets = [self._connections[p] for p in participant_ids if p in self._connections]
        if targets:
            await asyncio.gather(*(c.send(message) for c in targets), return_exceptions=True)
