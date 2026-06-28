"""
Live presence — which accounts are currently connected to a meeting socket.

Reference-counted by email (a user may have several tabs open). Used by the
contacts API to overlay real online status onto the directory.
"""
from __future__ import annotations

from collections import defaultdict

_counts: dict[str, int] = defaultdict(int)


def mark_online(email: str | None) -> None:
    if email:
        _counts[email.lower()] += 1


def mark_offline(email: str | None) -> None:
    if not email:
        return
    e = email.lower()
    if _counts.get(e, 0) > 1:
        _counts[e] -= 1
    else:
        _counts.pop(e, None)


def is_online(email: str | None) -> bool:
    return bool(email) and _counts.get(email.lower(), 0) > 0
