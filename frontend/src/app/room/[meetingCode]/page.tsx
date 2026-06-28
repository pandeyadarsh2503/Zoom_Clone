"use client";

/**
 * Meeting Room — UI only (hardcoded peers, no WebRTC / no backend).
 *
 * The local user ("You") is the host. Host controls let them mute individuals,
 * mute everyone, (UI) promote, lock the room, remove a participant, and end the
 * meeting. Peers are local state so removing one updates both the grid and the
 * participant list. Media toggles use the local roomStore.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Users,
  MessageSquare,
  PhoneOff,
  X,
  Copy,
  Check,
  ShieldCheck,
  Send,
  MoreVertical,
  MoreHorizontal,
  UserMinus,
  Crown,
  Lock,
  LockOpen,
  VolumeX,
  Smile,
  Hand,
  LayoutGrid,
  Maximize2,
  Captions,
  Sparkles,
  Disc,
  Settings,
  Presentation,
  BarChart3,
  Grid2x2,
  Pencil,
  ScreenShare,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useRoomStore } from "@/store/roomStore";
import { useMeetingSocket } from "@/hooks/useMeetingSocket";
import { cn, getInitials } from "@/lib/utils";

// Deterministic avatar accent for a real (remote) participant.
const REMOTE_ACCENTS = [
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-amber-500 to-orange-600",
  "from-lime-500 to-emerald-600",
  "from-indigo-500 to-purple-600",
];
function accentFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return REMOTE_ACCENTS[h % REMOTE_ACCENTS.length];
}

interface RemotePeer { id: string; name: string; accent: string; muted: boolean; videoOff: boolean; hand: boolean; screenSharing: boolean }

// ── Hardcoded peers (UI placeholders — not from any backend) ────────────────
interface Peer {
  id: string;
  name: string;
  videoOn: boolean;
  muted: boolean;
  role: "attendee" | "cohost";
  accent: string;
}

const INITIAL_PEERS: Peer[] = [
  { id: "p1", name: "Sarah Chen", videoOn: true, muted: false, role: "attendee", accent: "from-rose-500 to-orange-500" },
  { id: "p2", name: "Marcus Lee", videoOn: false, muted: true, role: "attendee", accent: "from-sky-500 to-indigo-500" },
  { id: "p3", name: "Priya Sharma", videoOn: true, muted: false, role: "attendee", accent: "from-emerald-500 to-teal-500" },
];

type Panel = "participants" | "chat" | "polls" | "breakout" | null;
const YOU_ACCENT = "from-violet-500 to-blue-500";

// ── Video tile ──────────────────────────────────────────────────────────────
function VideoTile({
  name,
  initials,
  videoOn,
  muted,
  accent,
  you,
  host,
  compact,
  active,
  handRaised,
}: {
  name: string;
  initials: string;
  videoOn: boolean;
  muted: boolean;
  accent: string;
  you?: boolean;
  host?: boolean;
  compact?: boolean;
  active?: boolean;
  handRaised?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-[#18181b] transition-shadow",
        compact ? "h-full w-44 shrink-0" : "h-full w-full",
        active ? "ring-2 ring-[#2D8CFF] shadow-[0_0_0_3px_rgba(45,140,255,0.25)]" : "ring-1 ring-white/5",
      )}
    >
      {handRaised && (
        <span className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm shadow-lg" title="Raised hand">
          ✋
        </span>
      )}
      {videoOn ? (
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", accent)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn("flex items-center justify-center rounded-full bg-gradient-to-br text-white font-bold", accent, compact ? "h-12 w-12 text-sm" : "h-20 w-20 text-2xl")}>
            {initials}
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {muted ? <MicOff className="h-3.5 w-3.5 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-emerald-400" />}
          {you ? `${name} (You)` : name}
          {host && <Crown className="h-3 w-3 text-amber-400" />}
        </span>
      </div>
    </div>
  );
}

// ── Toolbar button ──────────────────────────────────────────────────────────
function ToolButton({
  icon,
  label,
  onClick,
  active,
  danger,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  badge?: number;
}) {
  return (
    <button onClick={onClick} className="group flex w-16 flex-col items-center gap-1.5 outline-none cursor-pointer">
      <span
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
          danger ? "bg-red-500/15 text-red-400 group-hover:bg-red-500/25" : active ? "bg-white/15 text-white" : "bg-white/5 text-white/80 group-hover:bg-white/10",
        )}
      >
        {icon}
        {typeof badge === "number" && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0E72ED] px-1 text-[10px] font-bold text-white">{badge}</span>
        )}
      </span>
      <span className="text-[11px] font-medium text-white/60 group-hover:text-white/80">{label}</span>
    </button>
  );
}

// ── Participant row (with host kebab menu) ──────────────────────────────────
function ParticipantRow({
  name,
  initials,
  accent,
  muted,
  videoOn,
  host,
  cohost,
  you,
  canManage,
  onMute,
  onPromote,
  onRemove,
}: {
  name: string;
  initials: string;
  accent: string;
  muted: boolean;
  videoOn: boolean;
  host?: boolean;
  cohost?: boolean;
  you?: boolean;
  canManage?: boolean;
  onMute?: () => void;
  onPromote?: () => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", accent)}>{initials}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
        {you ? `${name} (You)` : name}
        {host && <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">Host</span>}
        {cohost && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/60">Co-host</span>}
      </span>
      <span className="flex items-center gap-2 text-white/50">
        {muted ? <MicOff className="h-4 w-4 text-red-400" /> : <Mic className="h-4 w-4" />}
        {videoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-white/40" />}
      </span>

      {canManage && (
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-1.5 text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 sm:opacity-0 cursor-pointer"
            aria-label={`Manage ${name}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-white/10 bg-[#1c1c20] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] animate-scale-in" role="menu">
              <button onClick={() => { setOpen(false); onMute?.(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-white/5 cursor-pointer">
                {muted ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />} {muted ? "Ask to unmute" : "Mute"}
              </button>
              <button onClick={() => { setOpen(false); onPromote?.(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/80 hover:bg-white/5 cursor-pointer">
                <Crown className="h-4 w-4" /> {cohost ? "Revoke co-host" : "Make co-host"}
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button onClick={() => { setOpen(false); onRemove?.(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10 cursor-pointer">
                <UserMinus className="h-4 w-4" /> Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PanelShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[#101013]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white cursor-pointer" aria-label="Close panel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      {footer}
    </div>
  );
}

interface ChatMsg { id: number; name: string; text: string; mine: boolean; accent: string }

function ChatPanel({ onClose, messages, onSend, disabled }: { onClose: () => void; messages: ChatMsg[]; onSend: (t: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  };
  return (
    <PanelShell
      title="Chat"
      onClose={onClose}
      footer={
        disabled ? (
          <div className="border-t border-white/10 p-3">
            <p className="flex items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs font-medium text-white/50">
              <Lock className="h-3.5 w-3.5" /> The host has disabled chat.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 focus-within:bg-white/10">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                maxLength={2000}
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              <button type="submit" disabled={!text.trim()} className="shrink-0 text-white/50 transition hover:text-[#2D8CFF] disabled:opacity-40 cursor-pointer" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        )
      }
    >
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40"><MessageSquare className="h-6 w-6" /></span>
          <p className="text-sm font-medium text-white/70">No messages yet</p>
          <p className="text-xs leading-relaxed text-white/40">Say hello to the meeting.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-1", m.mine ? "items-end" : "items-start")}>
              <span className="px-1 text-[11px] font-medium text-white/40">{m.mine ? "You" : m.name}</span>
              <span className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.mine ? "bg-[#0E72ED] text-white" : "bg-white/10 text-white/90")}>{m.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
    </PanelShell>
  );
}

// ── Polls panel ─────────────────────────────────────────────────────────────
function PollsPanel({
  onClose,
  poll,
  onCreate,
  onVote,
}: {
  onClose: () => void;
  poll: { question: string; options: { text: string; votes: number }[]; voted: number | null } | null;
  onCreate: (q: string, opts: string[]) => void;
  onVote: (i: number) => void;
}) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const inputCls = "h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#2D8CFF]/50";

  if (!poll) {
    const valid = q.trim() && opts.filter((o) => o.trim()).length >= 2;
    return (
      <PanelShell title="Polls" onClose={onClose}>
        <div className="flex flex-col gap-3 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question…" className={inputCls} />
          {opts.map((o, i) => (
            <input key={i} value={o} onChange={(e) => setOpts((a) => a.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} className={inputCls} />
          ))}
          {opts.length < 4 && (
            <button onClick={() => setOpts((a) => [...a, ""])} className="self-start text-sm font-semibold text-[#2D8CFF] hover:underline cursor-pointer">+ Add option</button>
          )}
          <button onClick={() => valid && onCreate(q.trim(), opts.filter((o) => o.trim()))} disabled={!valid} className="mt-1 h-10 rounded-lg bg-[#0E72ED] text-sm font-semibold text-white transition hover:bg-[#0966d9] disabled:opacity-40 cursor-pointer">Launch poll</button>
        </div>
      </PanelShell>
    );
  }

  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  return (
    <PanelShell title="Polls" onClose={onClose}>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-semibold text-white">{poll.question}</p>
        {poll.options.map((o, i) => {
          const pct = total ? Math.round((o.votes / total) * 100) : 0;
          return (
            <button key={i} onClick={() => onVote(i)} disabled={poll.voted !== null} className={cn("relative overflow-hidden rounded-xl border border-white/10 px-3 py-2.5 text-left transition", poll.voted === null ? "hover:bg-white/5 cursor-pointer" : "cursor-default", poll.voted === i && "border-[#2D8CFF]/50")}>
              <span className="absolute inset-y-0 left-0 bg-[#0E72ED]/25 transition-all" style={{ width: `${pct}%` }} />
              <span className="relative flex items-center justify-between text-sm text-white/90"><span>{o.text}</span><span className="font-semibold text-white/60">{pct}%</span></span>
            </button>
          );
        })}
        <p className="text-xs text-white/40">{total} vote{total === 1 ? "" : "s"}{poll.voted !== null && " · You voted"}</p>
      </div>
    </PanelShell>
  );
}

// ── Breakout rooms panel ────────────────────────────────────────────────────
function BreakoutPanel({ onClose, names, onBroadcast }: { onClose: () => void; names: string[]; onBroadcast: (rooms: { name: string; members: string[] }[]) => void }) {
  const [rooms, setRooms] = useState<{ name: string; members: string[] }[] | null>(null);
  const create = (n: number) => {
    const r = Array.from({ length: n }, (_, i) => ({ name: `Room ${i + 1}`, members: [] as string[] }));
    names.forEach((m, i) => r[i % n].members.push(m));
    setRooms(r);
    onBroadcast(r); // notify everyone over the backend
  };
  return (
    <PanelShell title="Breakout rooms" onClose={onClose}>
      {!rooms ? (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-sm text-white/60">Split everyone into smaller rooms.</p>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button key={n} onClick={() => create(n)} className="h-10 rounded-lg bg-white/5 px-4 text-sm font-semibold text-white/85 transition hover:bg-white/10 cursor-pointer">{n} rooms</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {rooms.map((r, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{r.name} <span className="text-white/40">({r.members.length})</span></p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {r.members.map((m) => <span key={m} className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/80">{m}</span>)}
              </div>
            </div>
          ))}
          <button onClick={() => setRooms(null)} className="self-start text-sm font-semibold text-[#2D8CFF] hover:underline cursor-pointer">Reassign</button>
        </div>
      )}
    </PanelShell>
  );
}

// ── Collaborative whiteboard canvas ─────────────────────────────────────────
interface Stroke { points: number[][]; color: string; width: number }

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number) {
  if (!s.points || s.points.length < 1) return;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width || 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  s.points.forEach((p, i) => {
    const x = p[0] * w, y = p[1] * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function WhiteboardCanvas({ strokes, onStroke, onClear }: { strokes: Stroke[]; onStroke: (s: Stroke) => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const current = useRef<number[][]>([]);
  const [color, setColor] = useState("#0E72ED");

  const redraw = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    strokes.forEach((s) => drawStroke(ctx, s, cv.width, cv.height));
  };
  useEffect(() => { redraw(); });

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => {
      const r = cv.getBoundingClientRect();
      cv.width = r.width;
      cv.height = r.height;
      redraw();
    });
    ro.observe(cv);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent): [number, number] => {
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };
  const down = (e: React.PointerEvent) => { drawing.current = true; current.current = [pos(e)]; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const p = pos(e);
    const prev = current.current[current.current.length - 1];
    current.current.push(p);
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(prev[0] * cv.width, prev[1] * cv.height);
    ctx.lineTo(p[0] * cv.width, p[1] * cv.height);
    ctx.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (current.current.length > 0) onStroke({ points: current.current, color, width: 3 });
    current.current = [];
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white">
      <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} className="h-full w-full cursor-crosshair touch-none" />
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl bg-white/95 p-1.5 shadow ring-1 ring-black/5">
        {["#0E72ED", "#E5372A", "#16A34A", "#111827"].map((c) => (
          <button key={c} onClick={() => setColor(c)} style={{ background: c }} className={cn("h-6 w-6 rounded-full transition", color === c && "ring-2 ring-gray-400 ring-offset-1")} aria-label={`Color ${c}`} />
        ))}
        <button onClick={onClear} className="ml-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer">Clear</button>
      </div>
    </div>
  );
}

// ── Rename dialog ───────────────────────────────────────────────────────────
function RenameDialog({ initial, onClose, onSave }: { initial: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c1c20] p-6 animate-fade-in">
        <h3 className="text-base font-bold text-white">Rename yourself</h3>
        <p className="mt-1 text-sm text-white/55">This is how others see you in the meeting.</p>
        <form onSubmit={(e) => { e.preventDefault(); onSave(name); }} className="mt-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white outline-none focus:border-[#2D8CFF]/50"
          />
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white/70 transition hover:bg-white/5 cursor-pointer">Cancel</button>
            <button type="submit" disabled={!name.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white transition hover:bg-[#0966d9] disabled:opacity-50 cursor-pointer">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const params = useParams<{ meetingCode: string }>();
  const router = useRouter();
  const meetingCode = params.meetingCode;

  const user = useUserStore((s) => s.user);
  const { isMuted, isVideoOff, isSharingScreen, toggleMute, toggleVideo, setIsSharingScreen, reset } = useRoomStore();

  // Host is the real first-joiner reported by the backend (optimistic true while
  // alone / connecting). Permissions mirror the backend room state.
  const [isHost, setIsHost] = useState(true);
  const [perms, setPerms] = useState({ allow_share: true, allow_chat: true, allow_rename: true });

  // Screen share (real getDisplayMedia capture).
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  // In-meeting self-rename.
  const [renameOpen, setRenameOpen] = useState(false);
  const [myNameOverride, setMyNameOverride] = useState<string | null>(null);

  const [peers, setPeers] = useState<Peer[]>(INITIAL_PEERS);
  const [panel, setPanel] = useState<Panel>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [locked, setLocked] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Peer | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);
  const hostMenuRef = useRef<HTMLDivElement>(null);

  // Engagement + view state (UI only).
  const [view, setView] = useState<"gallery" | "speaker">("gallery");
  const [handRaised, setHandRaised] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const reactionId = useRef(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const chatId = useRef(0);
  // Waiting room (people the host can admit)
  const [waiting, setWaiting] = useState<{ id: string; name: string; accent: string }[]>([
    { id: "w1", name: "Jordan Diaz", accent: "from-fuchsia-500 to-purple-600" },
    { id: "w2", name: "Lin Wei", accent: "from-cyan-500 to-blue-500" },
  ]);
  // Whiteboard overlay
  const [whiteboardOn, setWhiteboardOn] = useState(false);
  // Poll (single active poll for this UI)
  const [poll, setPoll] = useState<{ question: string; options: { text: string; votes: number }[]; voted: number | null } | null>(null);

  // ── Real-time backend (presence, chat, whiteboard, breakout) ──
  const rt = useMeetingSocket(meetingCode, user?.display_name || "You");
  const [remote, setRemote] = useState<RemotePeer[]>([]);
  const [breakoutMsg, setBreakoutMsg] = useState<string | null>(null);
  const [board, setBoard] = useState<Stroke[]>([]);

  useEffect(() => {
    const toRemote = (p: { id: string; name: string; is_muted: boolean; is_video_off: boolean; hand_raised: boolean; is_screen_sharing?: boolean }): RemotePeer => ({
      id: p.id, name: p.name, accent: accentFor(p.id), muted: p.is_muted, videoOff: p.is_video_off, hand: p.hand_raised, screenSharing: !!p.is_screen_sharing,
    });
    const offs = [
      rt.on("room-state", (d: { you?: { is_host?: boolean }; participants: any[]; board?: Stroke[]; permissions?: typeof perms; locked?: boolean }) => {
        setRemote(d.participants.filter((p) => p.id !== rt.pid).map(toRemote));
        setBoard(d.board ?? []);
        if (d.you) setIsHost(!!d.you.is_host);
        if (d.permissions) setPerms(d.permissions);
        if (typeof d.locked === "boolean") setLocked(d.locked);
      }),
      rt.on("lock-state", (d: { locked: boolean }) => setLocked(d.locked)),
      rt.on("draw", (d: { stroke: Stroke }) => setBoard((b) => [...b, d.stroke])),
      rt.on("clear-board", () => setBoard([])),
      rt.on("participant-joined", (d: { participant: any }) => {
        setRemote((r) => [...r.filter((x) => x.id !== d.participant.id), toRemote(d.participant)]);
      }),
      rt.on("participant-left", (d: { participant_id: string }) => setRemote((r) => r.filter((x) => x.id !== d.participant_id))),
      rt.on("host-changed", (d: { host_id: string }) => setIsHost(d.host_id === rt.pid)),
      rt.on("permissions", (d: typeof perms) => setPerms(d)),
      rt.on("participant-renamed", (d: { participant_id: string; name: string }) => {
        setRemote((r) => r.map((x) => (x.id === d.participant_id ? { ...x, name: d.name } : x)));
      }),
      rt.on("chat", (d: { sender_id: string; name: string; text: string }) => {
        setMessages((m) => [...m, { id: ++chatId.current, name: d.name, text: d.text, mine: d.sender_id === rt.pid, accent: YOU_ACCENT }]);
      }),
      rt.on("media-state", (d: { participant_id: string; kind: string; enabled: boolean }) => {
        setRemote((r) => r.map((x) => (x.id === d.participant_id ? {
          ...x,
          muted: d.kind === "audio" ? !d.enabled : x.muted,
          videoOff: d.kind === "video" ? !d.enabled : x.videoOff,
          screenSharing: d.kind === "screen" ? d.enabled : x.screenSharing,
        } : x)));
      }),
      rt.on("hand", (d: { participant_id: string; raised: boolean }) => setRemote((r) => r.map((x) => (x.id === d.participant_id ? { ...x, hand: d.raised } : x)))),
      rt.on("breakout", (d: { rooms: { name: string; members: string[] }[] }) => {
        const meName = `${user?.display_name || "You"} (You)`;
        const mine = d.rooms?.find((rm) => rm.members.some((m) => m === meName || m === (user?.display_name || "You")));
        setBreakoutMsg(mine ? `You're assigned to ${mine.name}` : "Breakout rooms opened");
      }),
      rt.on("breakout-end", () => setBreakoutMsg(null)),
    ];
    return () => offs.forEach((o) => o());
  }, [rt, user?.display_name]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Close the remove dialog / side panel on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (removeTarget) setRemoveTarget(null);
      else if (panel) setPanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [removeTarget, panel]);

  // Close the host menu on outside click.
  useEffect(() => {
    if (!hostMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (hostMenuRef.current && !hostMenuRef.current.contains(e.target as Node)) setHostMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [hostMenuOpen]);

  // Close reactions / more popovers on outside click.
  useEffect(() => {
    if (!reactionsOpen && !moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) setReactionsOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [reactionsOpen, moreOpen]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((m) => (m === msg ? null : m)), 2600);
  };

  const sendReaction = (emoji: string) => {
    const id = ++reactionId.current;
    const left = 25 + Math.random() * 50; // % horizontal position
    setReactions((r) => [...r, { id, emoji, left }]);
    setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 3000);
    setReactionsOpen(false);
  };

  const toggleHand = () => {
    rt.send("hand", { raised: !handRaised });
    setHandRaised((h) => {
      flash(h ? "Hand lowered" : "Hand raised ✋");
      return !h;
    });
    setReactionsOpen(false);
  };

  const youName = myNameOverride || user?.display_name || "You";
  const youInitials = getInitials(youName);

  // ── Host actions (local state only) ───────────────────────────
  const muteOne = (id: string) => setPeers((ps) => ps.map((p) => (p.id === id ? { ...p, muted: !p.muted } : p)));
  const promoteOne = (id: string) => setPeers((ps) => ps.map((p) => (p.id === id ? { ...p, role: p.role === "cohost" ? "attendee" : "cohost" } : p)));
  const muteAll = () => { setPeers((ps) => ps.map((p) => ({ ...p, muted: true }))); flash("All participants muted"); };
  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    rt.send("lock", { locked: next }); // gate new joins on the backend + sync everyone
    flash(next ? "Meeting locked — new participants can’t join" : "Meeting unlocked");
  };

  // Chat — sent over the WebSocket; the server broadcasts it back to everyone
  // (including us), so it renders via the "chat" subscription above.
  const sendMessage = (text: string) => rt.send("chat", { text });

  // Local media toggles also broadcast presence to other participants.
  const handleToggleMute = () => { toggleMute(); rt.send("media-state", { kind: "audio", enabled: isMuted }); };
  const handleToggleVideo = () => { toggleVideo(); rt.send("media-state", { kind: "video", enabled: isVideoOff }); };

  // ── Screen share — real getDisplayMedia capture ───────────────
  const stopShare = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsSharingScreen(false);
    rt.send("media-state", { kind: "screen", enabled: false });
  };
  const startShare = async () => {
    if (!isHost && !perms.allow_share) { flash("The host has disabled screen sharing."); return; }
    if (!navigator.mediaDevices?.getDisplayMedia) { flash("Screen sharing isn’t supported here."); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      // Fires when the user clicks the browser's native "Stop sharing".
      stream.getVideoTracks()[0]?.addEventListener("ended", stopShare);
      setIsSharingScreen(true);
      rt.send("media-state", { kind: "screen", enabled: true });
    } catch {
      /* user dismissed the picker — no-op */
    }
  };
  const toggleShare = () => { if (isSharingScreen) stopShare(); else startShare(); };

  // Bind the captured stream to the <video> element while sharing.
  useEffect(() => {
    if (isSharingScreen && screenVideoRef.current && screenStreamRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [isSharingScreen]);
  // Stop capture if the room unmounts while still sharing.
  useEffect(() => () => { screenStreamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  // ── Host permissions & self-rename ────────────────────────────
  const togglePerm = (key: "allow_share" | "allow_chat" | "allow_rename") => {
    const next = { ...perms, [key]: !perms[key] };
    setPerms(next);
    rt.send("permissions", { [key]: next[key] });
  };
  const applyRename = (name: string) => {
    const n = name.trim().slice(0, 60);
    if (!n) return;
    setMyNameOverride(n);
    rt.send("rename", { name: n });
    setRenameOpen(false);
    flash("Name updated");
  };
  const canRename = isHost || perms.allow_rename;
  const canShare = isHost || perms.allow_share;
  const chatDisabled = !isHost && !perms.allow_chat;
  const remoteSharer = remote.find((r) => r.screenSharing) ?? null;

  // Whiteboard — strokes relay over WS (server doesn't echo to sender, so add locally).
  const sendStroke = (s: Stroke) => { rt.send("draw", { stroke: s }); setBoard((b) => [...b, s]); };
  const clearBoard = () => { rt.send("clear-board"); setBoard([]); };

  // Waiting room → admit. Updaters stay pure (no nested setState); peer adds
  // are deduped so React strict-mode's double-invoke can't double-admit.
  const admit = (id: string) => {
    if (locked) { flash("Unlock the meeting to admit participants."); return; }
    const w = waiting.find((x) => x.id === id);
    if (!w) return;
    setPeers((ps) => (ps.some((p) => p.id === w.id) ? ps : [...ps, { id: w.id, name: w.name, videoOn: false, muted: false, role: "attendee" as const, accent: w.accent }]));
    setWaiting((ws) => ws.filter((x) => x.id !== id));
    flash(`${w.name} admitted`);
  };
  const admitAll = () => {
    if (locked) { flash("Unlock the meeting to admit participants."); return; }
    setPeers((ps) => {
      const have = new Set(ps.map((p) => p.id));
      const add = waiting.filter((w) => !have.has(w.id)).map((w) => ({ id: w.id, name: w.name, videoOn: false, muted: false, role: "attendee" as const, accent: w.accent }));
      return [...ps, ...add];
    });
    setWaiting([]);
    flash("Everyone admitted");
  };

  // Polls
  const createPoll = (question: string, options: string[]) => {
    setPoll({ question, options: options.map((text) => ({ text, votes: 0 })), voted: null });
  };
  const votePoll = (idx: number) => {
    setPoll((p) => (!p || p.voted !== null ? p : { ...p, voted: idx, options: p.options.map((o, i) => (i === idx ? { ...o, votes: o.votes + 1 } : o)) }));
  };
  const confirmRemove = () => {
    if (!removeTarget) return;
    setPeers((ps) => ps.filter((p) => p.id !== removeTarget.id));
    flash(`${removeTarget.name} was removed from the meeting`);
    setRemoveTarget(null);
  };

  const tiles = useMemo(
    () => [
      { id: "you", name: youName, initials: youInitials, videoOn: !isVideoOff, muted: isMuted, accent: YOU_ACCENT, you: true, host: isHost },
      ...remote.map((r) => ({ id: r.id, name: r.name, initials: getInitials(r.name), videoOn: !r.videoOff, muted: r.muted, accent: r.accent, you: false, host: false })),
      ...peers.map((p) => ({ id: p.id, name: p.name, initials: getInitials(p.name), videoOn: p.videoOn, muted: p.muted, accent: p.accent, you: false, host: false })),
    ],
    [youName, youInitials, isVideoOff, isMuted, peers, isHost, remote],
  );

  // Rotate the "active speaker" among unmuted tiles for a lifelike highlight.
  useEffect(() => {
    const ids = tiles.filter((t) => !t.muted).map((t) => t.id);
    if (ids.length === 0) { setActiveSpeakerId(null); return; }
    setActiveSpeakerId((cur) => (cur && ids.includes(cur) ? cur : ids[0]));
    const i = setInterval(() => setActiveSpeakerId(ids[Math.floor(Math.random() * ids.length)]), 3500);
    return () => clearInterval(i);
  }, [tiles]);

  const activeTile = tiles.find((t) => t.id === activeSpeakerId) ?? tiles[0];
  const otherTiles = tiles.filter((t) => t.id !== activeTile?.id);

  const total = tiles.length;
  const gridClass = total <= 1 ? "grid-cols-1" : total <= 4 ? "grid-cols-1 sm:grid-cols-2" : total <= 6 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  const copyCode = () => { navigator.clipboard?.writeText(meetingCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const leave = () => { reset(); router.push("/"); };
  const endForAll = () => { reset(); router.push("/"); };

  return (
    <div className="flex h-full w-full flex-col bg-[#09090d] text-white">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden h-8 items-center rounded-lg bg-white/5 px-2.5 text-[15px] font-bold lowercase tracking-tight text-[#2D8CFF] sm:inline-flex">zoom</span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate text-sm font-semibold text-white">
              Meeting room
              {locked && <Lock className="h-3.5 w-3.5 text-amber-400" />}
            </p>
            <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-white/50 transition hover:text-white/80 cursor-pointer">
              <span className="font-mono">{meetingCode}</span>
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {recording && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse-ring" /> REC
            </span>
          )}
          {/* View toggle */}
          <div className="hidden items-center gap-0.5 rounded-lg bg-white/5 p-0.5 sm:flex" role="group" aria-label="View">
            <button onClick={() => setView("gallery")} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors cursor-pointer", view === "gallery" ? "bg-white/15 text-white" : "text-white/55 hover:text-white")} aria-pressed={view === "gallery"}>
              <LayoutGrid className="h-3.5 w-3.5" /> Gallery
            </button>
            <button onClick={() => setView("speaker")} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors cursor-pointer", view === "speaker" ? "bg-white/15 text-white" : "text-white/55 hover:text-white")} aria-pressed={view === "speaker"}>
              <Maximize2 className="h-3.5 w-3.5" /> Speaker
            </button>
          </div>
          {isHost && <span className="hidden items-center gap-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300 lg:inline-flex"><Crown className="h-3.5 w-3.5" /> Host</span>}
          {rt.status !== "connected" && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-ring" /> {rt.status === "reconnecting" ? "Reconnecting…" : "Connecting…"}
            </span>
          )}
          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/80">{mmss}</span>
        </div>
      </header>

      {breakoutMsg && (
        <div className="flex items-center justify-center gap-2 border-b border-white/10 bg-[#0E72ED]/15 px-4 py-2 text-sm font-semibold text-[#2D8CFF]">
          <Grid2x2 className="h-4 w-4" /> {breakoutMsg}
        </div>
      )}

      {remoteSharer && !isSharingScreen && (
        <div className="flex items-center justify-center gap-2 border-b border-white/10 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
          <ScreenShare className="h-4 w-4" /> {remoteSharer.name} is sharing their screen
        </div>
      )}

      {/* Stage + panel */}
      <div className="relative flex min-h-0 flex-1">
        <main className="relative flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          {whiteboardOn ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="relative min-h-0 flex-1">
                <button onClick={() => setWhiteboardOn(false)} className="absolute right-3 top-3 z-10 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 cursor-pointer">Stop</button>
                <WhiteboardCanvas strokes={board} onStroke={sendStroke} onClear={clearBoard} />
              </div>
              <div className="flex h-24 shrink-0 gap-3 overflow-x-auto">
                {tiles.map((t) => <VideoTile key={t.id} {...t} compact handRaised={t.you ? handRaised : false} />)}
              </div>
            </div>
          ) : isSharingScreen ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black ring-1 ring-white/5">
                <video ref={screenVideoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                  <ScreenShare className="h-3.5 w-3.5" /> You’re sharing your screen
                </span>
                <button onClick={stopShare} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 cursor-pointer">
                  Stop sharing
                </button>
              </div>
              <div className="flex h-24 shrink-0 gap-3 overflow-x-auto">
                {tiles.map((t) => <VideoTile key={t.id} {...t} compact handRaised={t.you ? handRaised : false} />)}
              </div>
            </div>
          ) : view === "speaker" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="min-h-0 flex-1">
                {activeTile && <VideoTile {...activeTile} active handRaised={activeTile.you ? handRaised : false} />}
              </div>
              {otherTiles.length > 0 && (
                <div className="flex h-24 shrink-0 gap-3 overflow-x-auto">
                  {otherTiles.map((t) => <VideoTile key={t.id} {...t} compact handRaised={t.you ? handRaised : false} />)}
                </div>
              )}
            </div>
          ) : (
            <div className={cn("grid min-h-0 flex-1 gap-3 sm:gap-4", gridClass)}>
              {tiles.map((t) => (
                <div key={t.id} className="min-h-0">
                  <VideoTile {...t} active={t.id === activeSpeakerId} handRaised={t.you ? handRaised : false} />
                </div>
              ))}
            </div>
          )}

          {/* Live captions (UI) */}
          {captionsOn && (
            <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-4">
              <div className="max-w-2xl rounded-xl bg-black/75 px-4 py-2 text-center text-sm font-medium text-white backdrop-blur-sm">
                <span className="text-white/45">{youName}: </span>Thanks everyone for joining — let’s get started.
              </div>
            </div>
          )}

          {/* Floating reactions overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {reactions.map((r) => (
              <span key={r.id} className="animate-reaction absolute bottom-6 text-4xl" style={{ left: `${r.left}%` }}>{r.emoji}</span>
            ))}
          </div>
        </main>

        {/* Side panel */}
        {panel && (
          <>
            <div className="absolute inset-0 z-30 bg-black/50 sm:hidden" onClick={() => setPanel(null)} />
            <aside className="absolute inset-y-0 right-0 z-40 w-full max-w-sm border-l border-white/10 sm:static sm:w-[360px] sm:max-w-none">
              {panel === "participants" ? (
                <PanelShell
                  title={`Participants (${total})`}
                  onClose={() => setPanel(null)}
                  footer={
                    isHost ? (
                      <div className="border-t border-white/10 p-3">
                        <button onClick={endForAll} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 cursor-pointer">
                          <PhoneOff className="h-4 w-4" /> End meeting for all
                        </button>
                      </div>
                    ) : undefined
                  }
                >
                  {/* Host controls */}
                  {isHost && (
                    <div className="flex items-center gap-2 border-b border-white/10 p-3">
                      <button onClick={muteAll} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 cursor-pointer">
                        <VolumeX className="h-4 w-4" /> Mute all
                      </button>
                      <button onClick={toggleLock} className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer", locked ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25" : "bg-white/5 text-white/80 hover:bg-white/10")}>
                        {locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {locked ? "Unlock" : "Lock"}
                      </button>
                    </div>
                  )}
                  {isHost && waiting.length > 0 && (
                    <div className="border-b border-white/10 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/70">Waiting room ({waiting.length})</p>
                        <button onClick={admitAll} className="text-xs font-semibold text-[#2D8CFF] hover:underline cursor-pointer">Admit all</button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {waiting.map((w) => (
                          <div key={w.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", w.accent)}>{getInitials(w.name)}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">{w.name}</span>
                            <button onClick={() => admit(w.id)} className="rounded-lg bg-[#0E72ED] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#0966d9] cursor-pointer">Admit</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 p-3">
                    <ParticipantRow name={youName} initials={youInitials} accent={YOU_ACCENT} muted={isMuted} videoOn={!isVideoOff} host you />
                    {peers.map((p) => (
                      <ParticipantRow
                        key={p.id}
                        name={p.name}
                        initials={getInitials(p.name)}
                        accent={p.accent}
                        muted={p.muted}
                        videoOn={p.videoOn}
                        cohost={p.role === "cohost"}
                        canManage={isHost}
                        onMute={() => muteOne(p.id)}
                        onPromote={() => promoteOne(p.id)}
                        onRemove={() => setRemoveTarget(p)}
                      />
                    ))}
                  </div>
                </PanelShell>
              ) : panel === "polls" ? (
                <PollsPanel onClose={() => setPanel(null)} poll={poll} onCreate={createPoll} onVote={votePoll} />
              ) : panel === "breakout" ? (
                <BreakoutPanel
                  onClose={() => setPanel(null)}
                  names={[`${youName} (You)`, ...remote.map((r) => r.name), ...peers.map((p) => p.name)]}
                  onBroadcast={(rooms) => rt.send("breakout", { rooms })}
                />
              ) : (
                <ChatPanel onClose={() => setPanel(null)} messages={messages} onSend={sendMessage} disabled={chatDisabled} />
              )}
            </aside>
          </>
        )}
      </div>

      {/* Toolbar */}
      <footer className="flex h-20 shrink-0 items-center justify-center gap-1 border-t border-white/10 px-3 sm:gap-2">
        <ToolButton icon={isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />} label={isMuted ? "Unmute" : "Mute"} danger={isMuted} onClick={handleToggleMute} />
        <ToolButton icon={isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />} label={isVideoOff ? "Start video" : "Stop video"} danger={isVideoOff} onClick={handleToggleVideo} />
        <ToolButton icon={<MonitorUp className="h-5 w-5" />} label={canShare ? "Share" : "Locked"} active={isSharingScreen} onClick={canShare ? toggleShare : () => flash("The host has disabled screen sharing.")} />
        <ToolButton icon={<Users className="h-5 w-5" />} label="Participants" badge={total} active={panel === "participants"} onClick={() => setPanel((p) => (p === "participants" ? null : "participants"))} />
        <ToolButton icon={<MessageSquare className="h-5 w-5" />} label="Chat" active={panel === "chat"} onClick={() => setPanel((p) => (p === "chat" ? null : "chat"))} />

        {/* Reactions + Raise hand */}
        <div className="relative" ref={reactionsRef}>
          <ToolButton icon={<Smile className="h-5 w-5" />} label="React" active={reactionsOpen || handRaised} onClick={() => setReactionsOpen((o) => !o)} />
          {reactionsOpen && (
            <div className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1c1c20] p-2 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] animate-fade-in">
              <div className="flex items-center gap-1">
                {["👍", "👏", "❤️", "😂", "🎉", "😮"].map((e) => (
                  <button key={e} onClick={() => sendReaction(e)} className="flex h-10 w-10 items-center justify-center rounded-xl text-xl transition hover:bg-white/10 active:scale-90 cursor-pointer" aria-label={`React ${e}`}>{e}</button>
                ))}
              </div>
              <button onClick={toggleHand} className={cn("mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition cursor-pointer", handRaised ? "bg-amber-400/20 text-amber-300" : "text-white/80 hover:bg-white/10")}>
                <Hand className="h-4 w-4" /> {handRaised ? "Lower hand" : "Raise hand"}
              </button>
            </div>
          )}
        </div>

        {/* More */}
        <div className="relative" ref={moreRef}>
          <ToolButton icon={<MoreHorizontal className="h-5 w-5" />} label="More" active={moreOpen} onClick={() => setMoreOpen((o) => !o)} />
          {moreOpen && (
            <div className="absolute bottom-full left-1/2 z-50 mb-3 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-[#1c1c20] p-1.5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] animate-fade-in" role="menu">
              <button onClick={() => { setMoreOpen(false); setPanel("polls"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <BarChart3 className="h-4 w-4" /> Polls
              </button>
              <button onClick={() => { setMoreOpen(false); setWhiteboardOn(true); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Presentation className="h-4 w-4" /> Whiteboard
              </button>
              <button onClick={() => { setMoreOpen(false); setPanel("breakout"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Grid2x2 className="h-4 w-4" /> Breakout rooms
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button onClick={() => { setMoreOpen(false); setRecording((r) => { flash(r ? "Recording stopped" : "Recording started"); return !r; }); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Disc className={cn("h-4 w-4", recording && "text-red-400")} /> {recording ? "Stop recording" : "Record"}
              </button>
              <button onClick={() => { setMoreOpen(false); setCaptionsOn((c) => { flash(c ? "Captions hidden" : "Live captions on"); return !c; }); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Captions className="h-4 w-4" /> {captionsOn ? "Hide captions" : "Live captions"}
              </button>
              <button onClick={() => { setMoreOpen(false); flash("Virtual background — preview only"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Sparkles className="h-4 w-4" /> Virtual background
              </button>
              <div className="my-1 h-px bg-white/10" />
              <button onClick={() => { setMoreOpen(false); if (canRename) setRenameOpen(true); else flash("The host has disabled renaming."); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Pencil className="h-4 w-4" /> Rename
              </button>
              <button onClick={() => { setMoreOpen(false); router.push("/settings"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                <Settings className="h-4 w-4" /> Settings
              </button>
            </div>
          )}
        </div>

        {/* Host controls — only shown to the host */}
        {isHost && (
          <div className="relative" ref={hostMenuRef}>
            <ToolButton icon={<Crown className="h-5 w-5" />} label="Host" active={hostMenuOpen} onClick={() => setHostMenuOpen((o) => !o)} />
            {hostMenuOpen && (
              <div className="absolute bottom-full left-1/2 z-50 mb-3 w-60 -translate-x-1/2 rounded-xl border border-white/10 bg-[#1c1c20] p-1.5 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] animate-fade-in" role="menu">
                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/70">Host controls</p>
                <button onClick={() => { setHostMenuOpen(false); muteAll(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                  <VolumeX className="h-4 w-4" /> Mute all
                </button>
                <button onClick={() => { setHostMenuOpen(false); toggleLock(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                  {locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {locked ? "Unlock meeting" : "Lock meeting"}
                </button>
                <button onClick={() => { setHostMenuOpen(false); setPanel("participants"); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                  <Users className="h-4 w-4" /> Manage participants
                </button>
                <p className="px-3 pb-1 pt-1.5 text-[11px] leading-snug text-white/35">Remove or promote individuals from the Participants panel.</p>
                <div className="my-1 h-px bg-white/10" />
                <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/70">Participant permissions</p>
                {([
                  { key: "allow_share" as const, label: "Allow screen share", icon: <MonitorUp className="h-4 w-4" /> },
                  { key: "allow_chat" as const, label: "Allow chat", icon: <MessageSquare className="h-4 w-4" /> },
                  { key: "allow_rename" as const, label: "Allow rename", icon: <Pencil className="h-4 w-4" /> },
                ]).map((row) => (
                  <button key={row.key} onClick={() => togglePerm(row.key)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/85 hover:bg-white/5 cursor-pointer">
                    {row.icon} <span className="flex-1">{row.label}</span>
                    <span className={cn("flex h-5 w-9 items-center rounded-full px-0.5 transition-colors", perms[row.key] ? "justify-end bg-emerald-500/80" : "justify-start bg-white/15")}>
                      <span className="h-4 w-4 rounded-full bg-white shadow" />
                    </span>
                  </button>
                ))}
                <div className="my-1 h-px bg-white/10" />
                <button onClick={() => { setHostMenuOpen(false); endForAll(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer">
                  <PhoneOff className="h-4 w-4" /> End meeting for all
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mx-1 h-10 w-px bg-white/10 sm:mx-3" />
        <button onClick={leave} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer">
          <PhoneOff className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </footer>

      {/* Remove confirmation */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setRemoveTarget(null)} aria-hidden />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c1c20] p-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400"><UserMinus className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">Remove {removeTarget.name}?</h3>
                <p className="mt-1 text-sm text-white/60">They’ll be disconnected from the meeting. You can admit them again later.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRemoveTarget(null)} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white/70 transition hover:bg-white/5 cursor-pointer">Cancel</button>
              <button onClick={confirmRemove} className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer">
                <UserMinus className="h-4 w-4" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename dialog */}
      {renameOpen && (
        <RenameDialog initial={youName} onClose={() => setRenameOpen(false)} onSave={applyRename} />
      )}

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
          <div className="rounded-xl bg-[#1c1c20] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_28px_rgba(0,0,0,0.5)] ring-1 ring-white/10">{toast}</div>
        </div>
      )}
    </div>
  );
}
