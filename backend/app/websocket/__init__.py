"""Real-time meeting package — process-wide ConnectionManager + RoomManager singletons."""
from __future__ import annotations

from app.websocket.manager import ConnectionManager
from app.websocket.room_manager import RoomManager

connection_manager = ConnectionManager()
room_manager = RoomManager(connection_manager)

__all__ = ["connection_manager", "room_manager", "ConnectionManager", "RoomManager"]
