"""One live client link — failure-safe JSON transport, no room logic."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from starlette.websockets import WebSocket, WebSocketState

logger = logging.getLogger(__name__)


@dataclass
class Connection:
    participant_id: str
    meeting_code: str
    websocket: WebSocket

    @property
    def is_open(self) -> bool:
        return self.websocket.client_state == WebSocketState.CONNECTED

    async def send(self, message: dict[str, Any]) -> bool:
        if not self.is_open:
            return False
        try:
            await self.websocket.send_json(message)
            return True
        except Exception as exc:  # pragma: no cover
            logger.debug("send failed for %s: %s", self.participant_id, exc)
            return False
