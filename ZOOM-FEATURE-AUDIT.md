# Zoom Feature Audit & Roadmap — DRAFT for review

A comparison of **Zoom Workplace (web, 2026)** against our clone, so you can pick
what to build next. Based on current Zoom docs (see Sources at the bottom).

Legend: ✅ Done · 🟡 Partial · ❌ Missing · ⚙️ UI-only by design (no WebRTC/backend)

> **What I'm doing right now (no need to wait):** completing the in-meeting
> toolbar to match Zoom — **Reactions, Raise hand, a "More" menu, and
> Gallery/Speaker view toggle** (all UI-only). Everything else below is for you
> to review and prioritise.

---

## 1. Home / Dashboard
| Zoom | Us | Status |
|---|---|---|
| New Meeting (instant) | Creates a live meeting, opens room | ✅ |
| Join (code/link) | Modal: code or link + name | ✅ |
| Schedule | Title/desc/date/time/duration | ✅ |
| Meeting list (upcoming/recent) | Upcoming + Recent sections | ✅ |
| Share Screen shortcut | (we use the 4th card for "My Meetings") | 🟡 by choice |
| AI Companion search/summary | — | ❌ (see §9) |

## 2. Scheduling
| Zoom | Us | Status |
|---|---|---|
| Title, date, time, duration | All present | ✅ |
| **Invite participants by email** | — | ❌ |
| **Meeting passcode** | — | ❌ |
| **Waiting room toggle** | — | ❌ |
| **Recurring meetings** | — | ❌ |
| Default mic/cam on/off, allow join before host | — | ❌ |
| Auto-generated invite link | ✅ | ✅ |

## 3. Meetings management
| Zoom | Us | Status |
|---|---|---|
| List + filter + search | `/meetings` with tabs + search | ✅ |
| Edit / delete scheduled | ✅ | ✅ |
| Copy invite link | ✅ | ✅ |
| Recordings tab | — | ❌ (no recording) |

## 4. In-meeting — video & layout
| Zoom | Us | Status |
|---|---|---|
| Participant grid | ✅ (placeholder tiles) | ⚙️ |
| **Active-speaker highlight** | adding now | 🟡→✅ |
| **Speaker vs Gallery view** | adding now | 🟡→✅ |
| Name / mute / camera overlays | ✅ | ⚙️ |
| Host badge on tile | ✅ | ⚙️ |
| Pin / spotlight a participant | pin icon only (no logic) | 🟡 |
| Real WebRTC media | intentionally not built | ⚙️ |

## 5. In-meeting — engagement
| Zoom | Us | Status |
|---|---|---|
| **Reactions (emoji)** | adding now | ❌→✅ |
| **Raise hand** | adding now | ❌→✅ |
| Chat | placeholder panel | 🟡 (UI-only) |
| Polls / Quizzes | — | ❌ |
| Whiteboard | — | ❌ |
| Q&A | — | ❌ |
| Live captions / transcription | "More" toggle (UI) added now | 🟡 |

## 6. Host & security controls
| Zoom | Us | Status |
|---|---|---|
| Mute all | ✅ | ⚙️ |
| Lock meeting | ✅ (UI) | ⚙️ |
| Remove participant | ✅ | ⚙️ |
| End for all | ✅ | ⚙️ |
| Promote co-host | ✅ (UI) | ⚙️ |
| **Waiting room / admit** | — | ❌ |
| **Breakout rooms** | — | ❌ |
| **Allow/disable participant share, chat, rename** | — | ❌ |

## 7. Recording & transcription
| Zoom | Us | Status |
|---|---|---|
| Cloud/local recording | — | ❌ |
| Live transcription | UI toggle only | 🟡 |
| Post-meeting summary | — | ❌ |

## 8. Calendar / Contacts / Settings
| Zoom | Us | Status |
|---|---|---|
| Calendar with meetings | `/calendar` month grid | ✅ |
| Contacts directory | `/contacts` (UI list) | ⚙️ |
| Settings: profile, devices, notifications | `/settings` (profile real) | ✅ / ⚙️ |
| Presence / status | static in contacts | 🟡 |
| Real contacts backend | — | ❌ |

## 9. Bigger platform features (likely out of scope, listed for completeness)
- **AI Companion** (summaries, meeting prep, smart compose)
- **Team Chat** (persistent channels/DMs), **Phone**, **Webinars**, **Whiteboard**, **Docs/Clips**, **Mail/Calendar app**
- **Virtual backgrounds / appearance touch-up** (we add a UI toggle now; real needs camera)
- **Authentication / accounts / plans & billing** (we run single-user, no auth)

---

## Recommended next steps (my suggestion — your call)
1. **Scheduling polish** — passcode, waiting-room toggle, recurring, invite-by-email field, default-media options. *(Mostly real backend work; high value, low risk.)*
2. **In-meeting engagement** — Reactions ✅ + Raise hand ✅ (now), then a **real chat** (local-only or wire a simple WS), Polls, Whiteboard placeholder.
3. **Waiting room + admit flow** (UI), **Breakout rooms** (UI).
4. **Contacts/Settings** depth — persistence, presence.
5. Long-horizon: AI Companion, recording, webinars, auth.

> **Tell me which sections to build** and I'll implement them. The items marked
> "adding now" are already being done in this pass.

---

### Sources
- [What's New at Zoom](https://www.zoom.com/en/products/whats-new/)
- [Explore 21 Zoom Features](https://www.zoom.com/en/products/collaboration-tools/features/)
- [Meeting Controls — Zoom basics (USU)](https://www.usu.edu/teach/help-topics/zoom/meeting-controls)
- [Zoom breakout rooms guide](https://krisp.ai/blog/how-to-create-breakout-rooms-in-zoom/)
- [Scheduling meetings (Zoom support)](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060700)
- [Getting started using the Zoom Dashboard](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0061622)
