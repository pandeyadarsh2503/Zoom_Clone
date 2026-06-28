# Zoom Feature Audit & Roadmap

Status of our clone vs. **Zoom Workplace (web, 2026)**. Completed items have been
removed; this file now tracks only **what's left**.

Legend: 🟡 Partial · ❌ Missing · ⚙️ Intentionally UI-only (no real WebRTC)

---

## ✅ Completed (removed from the backlog)
Dashboard (New/Join/Schedule/My Meetings, lists) · Meetings management (list,
filter, search, edit, delete, copy link) · **Scheduling polish** (passcode,
waiting-room toggle, recurring, invite-by-email, default mic/cam, join-before-host)
· In-meeting toolbar (**reactions, raise hand, more menu, gallery/speaker view,
active-speaker highlight**) · Host controls (mute all, lock, remove, end, promote)
· **Real-time over WebSocket** (live **presence**, **chat**, collaborative
**whiteboard**, **breakout rooms**) · Waiting room + admit · Polls · Calendar ·
Contacts (**real DB backend** — list/add/delete, user-scoped + **live presence**)
· Settings (real profile + persisted prefs) · **Authentication** (register/login/JWT,
protected API + WS, logout) · **Billing** (plans page, mock) · **Real screen share**
(getDisplayMedia → live `<video>`, broadcast to others) · **Granular host controls**
(real host + allow/disable participant **share / chat / rename** over WS, server-enforced)
· In-meeting **self-rename**.

---

## What's left

### 1. Real media (deliberately UI-only today)
| Feature | Now | Status |
|---|---|---|
| WebRTC audio/video | hardcoded tiles + real presence | ⚙️ by design |
| Remote screen *pixels* | local capture is real; others see a "sharing" banner (no relay) | ⚙️ (needs WebRTC/SFU) |
| Virtual backgrounds / touch-up | "More" toggle only | 🟡 (needs camera) |
| Pin / spotlight a participant | pin icon, no logic | 🟡 |

### 2. In-meeting engagement
| Feature | Now | Status |
|---|---|---|
| Live captions / transcription | UI toggle + sample line | 🟡 (not real STT) |
| Q&A | — | ❌ |

### 3. Recording & transcription
| Feature | Now | Status |
|---|---|---|
| Cloud / local recording | Record button (UI) | ❌ no capture/storage |
| Post-meeting AI summary | — | ❌ |

### 4. Billing
| Feature | Now | Status |
|---|---|---|
| Real payments / plan change | mock plans page | 🟡 (no processor) |

### 5. Bigger platform surfaces (large, standalone)
- **AI Companion** (meeting summaries, prep, smart compose)
- **Team Chat** (persistent channels/DMs — our chat is in-meeting only)
- **Phone**, **Webinars**, **Docs / Clips**, **Mail / Calendar app**

---

## Suggested next (your call)
1. **Q&A** + make **live captions** real-ish (Web Speech API, browser STT).
2. **AI Companion** — wire a Claude-powered summary/assistant panel.
3. **Pin / spotlight** logic + **virtual background** (canvas/segmentation).
4. Long-horizon: real recording, Team Chat, Webinars, WebRTC media relay.

> Tell me which to build next.

---

### Sources
- [What's New at Zoom](https://www.zoom.com/en/products/whats-new/)
- [Explore 21 Zoom Features](https://www.zoom.com/en/products/collaboration-tools/features/)
- [Meeting Controls — Zoom basics (USU)](https://www.usu.edu/teach/help-topics/zoom/meeting-controls)
- [Zoom breakout rooms guide](https://krisp.ai/blog/how-to-create-breakout-rooms-in-zoom/)
