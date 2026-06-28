from __future__ import annotations

import enum


class MeetingStatus(str, enum.Enum):
    """
    Lifecycle states for a meeting session.

    Using `str, enum.Enum` means:
    - Values are plain strings ("live", not <MeetingStatus.LIVE: 'live'>).
    - JSON-serialisable without custom encoders.
    - Pydantic validates and serialises them transparently.
    - Direct comparison `meeting.status == "live"` works.

    State machine:
        SCHEDULED ──► LIVE ──► ENDED
             │
             └──► CANCELLED

    Only a host can trigger transitions; the service layer enforces this.
    ENDED and CANCELLED are terminal states — no further transitions allowed.
    """

    SCHEDULED = "scheduled"  # Created, not yet started.
    LIVE = "live"             # In progress — WebSocket room is open.
    ENDED = "ended"           # Host ended the session; replay available.
    CANCELLED = "cancelled"   # Abandoned before it started.


class ParticipantRole(str, enum.Enum):
    """
    Privilege level of a participant within a meeting room.

    HOST    – created the meeting; full control (mute others, end call,
              start recording, promote co-hosts).
    COHOST  – elevated by the host; shares most host privileges.
    ATTENDEE – default for every other joiner; can mute/unmute themselves.

    Stored as lowercase strings so the value is meaningful in API responses
    and requires no translation layer.
    """

    HOST = "host"
    COHOST = "cohost"
    ATTENDEE = "attendee"
