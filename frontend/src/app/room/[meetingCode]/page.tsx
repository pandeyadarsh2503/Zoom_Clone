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
  UserMinus,
  Crown,
  Lock,
  LockOpen,
  VolumeX,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useRoomStore } from "@/store/roomStore";
import { cn, getInitials } from "@/lib/utils";

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

type Panel = "participants" | "chat" | null;
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
}: {
  name: string;
  initials: string;
  videoOn: boolean;
  muted: boolean;
  accent: string;
  you?: boolean;
  host?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-[#18181b] ring-1 ring-white/5", compact ? "h-full w-44 shrink-0" : "h-full w-full")}>
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

function ChatPanel({ onClose }: { onClose: () => void }) {
  return (
    <PanelShell
      title="Chat"
      onClose={onClose}
      footer={
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 opacity-60">
            <input disabled placeholder="Type a message…" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none" />
            <Send className="h-4 w-4 shrink-0 text-white/40" />
          </div>
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40"><MessageSquare className="h-6 w-6" /></span>
        <p className="text-sm font-medium text-white/70">No messages yet</p>
        <p className="text-xs leading-relaxed text-white/40">In-call chat is a placeholder in this build.</p>
      </div>
    </PanelShell>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const params = useParams<{ meetingCode: string }>();
  const router = useRouter();
  const meetingCode = params.meetingCode;

  const user = useUserStore((s) => s.user);
  const { isMuted, isVideoOff, isSharingScreen, toggleMute, toggleVideo, setIsSharingScreen, reset } = useRoomStore();

  // Host = the local user, hardcoded for this UI-only build.
  const isHost = true;

  const [peers, setPeers] = useState<Peer[]>(INITIAL_PEERS);
  const [panel, setPanel] = useState<Panel>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [locked, setLocked] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Peer | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((m) => (m === msg ? null : m)), 2600);
  };

  const youName = user?.display_name || "You";
  const youInitials = user ? getInitials(user.display_name) : "Y";

  // ── Host actions (local state only) ───────────────────────────
  const muteOne = (id: string) => setPeers((ps) => ps.map((p) => (p.id === id ? { ...p, muted: !p.muted } : p)));
  const promoteOne = (id: string) => setPeers((ps) => ps.map((p) => (p.id === id ? { ...p, role: p.role === "cohost" ? "attendee" : "cohost" } : p)));
  const muteAll = () => { setPeers((ps) => ps.map((p) => ({ ...p, muted: true }))); flash("All participants muted"); };
  const confirmRemove = () => {
    if (!removeTarget) return;
    setPeers((ps) => ps.filter((p) => p.id !== removeTarget.id));
    flash(`${removeTarget.name} was removed from the meeting`);
    setRemoveTarget(null);
  };

  const tiles = useMemo(
    () => [
      { id: "you", name: youName, initials: youInitials, videoOn: !isVideoOff, muted: isMuted, accent: YOU_ACCENT, you: true, host: isHost },
      ...peers.map((p) => ({ id: p.id, name: p.name, initials: getInitials(p.name), videoOn: p.videoOn, muted: p.muted, accent: p.accent, you: false, host: false })),
    ],
    [youName, youInitials, isVideoOff, isMuted, peers, isHost],
  );

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
          {isHost && <span className="hidden items-center gap-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300 sm:inline-flex"><Crown className="h-3.5 w-3.5" /> Host</span>}
          <span className="hidden items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-emerald-400 sm:inline-flex"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted</span>
          <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/80">{mmss}</span>
        </div>
      </header>

      {/* Stage + panel */}
      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          {isSharingScreen ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex flex-1 items-center justify-center rounded-2xl bg-[#101013] ring-1 ring-white/5">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E72ED]/15 text-[#2D8CFF]"><MonitorUp className="h-7 w-7" /></span>
                  <p className="text-sm font-semibold text-white">You’re sharing your screen</p>
                  <p className="text-xs text-white/50">Everyone in the meeting can see your screen.</p>
                </div>
              </div>
              <div className="flex h-24 shrink-0 gap-3 overflow-x-auto">
                {tiles.map((t) => <VideoTile key={t.id} {...t} compact />)}
              </div>
            </div>
          ) : (
            <div className={cn("grid min-h-0 flex-1 gap-3 sm:gap-4", gridClass)}>
              {tiles.map((t) => <div key={t.id} className="min-h-0"><VideoTile {...t} /></div>)}
            </div>
          )}
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
                      <button onClick={() => { setLocked((l) => !l); flash(locked ? "Meeting unlocked" : "Meeting locked"); }} className={cn("inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer", locked ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25" : "bg-white/5 text-white/80 hover:bg-white/10")}>
                        {locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {locked ? "Unlock" : "Lock"}
                      </button>
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
              ) : (
                <ChatPanel onClose={() => setPanel(null)} />
              )}
            </aside>
          </>
        )}
      </div>

      {/* Toolbar */}
      <footer className="flex h-20 shrink-0 items-center justify-center gap-1 border-t border-white/10 px-3 sm:gap-2">
        <ToolButton icon={isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />} label={isMuted ? "Unmute" : "Mute"} danger={isMuted} onClick={toggleMute} />
        <ToolButton icon={isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />} label={isVideoOff ? "Start video" : "Stop video"} danger={isVideoOff} onClick={toggleVideo} />
        <ToolButton icon={<MonitorUp className="h-5 w-5" />} label="Share" active={isSharingScreen} onClick={() => setIsSharingScreen(!isSharingScreen)} />
        <ToolButton icon={<Users className="h-5 w-5" />} label="Participants" badge={total} active={panel === "participants"} onClick={() => setPanel((p) => (p === "participants" ? null : "participants"))} />
        <ToolButton icon={<MessageSquare className="h-5 w-5" />} label="Chat" active={panel === "chat"} onClick={() => setPanel((p) => (p === "chat" ? null : "chat"))} />
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

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
          <div className="rounded-xl bg-[#1c1c20] px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_28px_rgba(0,0,0,0.5)] ring-1 ring-white/10">{toast}</div>
        </div>
      )}
    </div>
  );
}
