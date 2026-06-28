"use client";

/**
 * Meetings — the "My Meetings" management page.
 *
 * Browse every meeting (host or attendee), filter by status, search, and act:
 * join/start a room, edit or delete a scheduled meeting, or copy its invite
 * link. Reuses the same API + helpers as the dashboard; no new architecture.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link as LinkIcon,
  User,
  Clock,
  Users,
  CalendarX2,
  AlertCircle,
} from "lucide-react";
import { meetingsApi } from "@/lib/api/meetings";
import { cn, formatTime, formatRelativeDay, formatDuration } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Meeting, MeetingStatus } from "@/types/meeting";

// ── Status chip ─────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: MeetingStatus }) {
  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold leading-none";
  if (status === "live")
    return (
      <span className={cn(base, "bg-[#FFE9E7] text-[#E5372A]")}>
        <span className="h-2 w-2 rounded-full bg-[#E5372A] animate-pulse-ring" /> Live
      </span>
    );
  if (status === "scheduled") return <span className={cn(base, "bg-[#E8F2FF] text-[#0E72ED]")}>Scheduled</span>;
  if (status === "ended") return <span className={cn(base, "bg-gray-100 text-gray-500")}>Ended</span>;
  return <span className={cn(base, "bg-[#FFF4E5] text-[#B7791F]")}>Cancelled</span>;
}

type FilterKey = "all" | "upcoming" | "live" | "past";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "past", label: "Past" },
];

function matchesFilter(m: Meeting, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "upcoming") return m.status === "scheduled";
  if (f === "live") return m.status === "live";
  return m.status === "ended" || m.status === "cancelled";
}

// ── Row ─────────────────────────────────────────────────────────────────────
function MeetingListRow({
  meeting,
  onJoin,
  onEdit,
  onCopy,
  onDelete,
  copied,
}: {
  meeting: Meeting;
  onJoin: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  copied: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const ts = meeting.scheduled_at ?? meeting.started_at ?? meeting.ended_at ?? meeting.created_at;
  const joinable = meeting.status === "live" || meeting.status === "scheduled";
  const duration =
    meeting.started_at && meeting.ended_at ? formatDuration(meeting.started_at, meeting.ended_at) : `${meeting.duration_minutes} min`;

  return (
    <div className="flex flex-col gap-4 p-5 transition-colors hover:bg-[#FAFBFC] sm:flex-row sm:items-center sm:gap-6">
      <div className="w-28 shrink-0 select-none">
        <p className="text-sm font-bold text-gray-900 tabular-nums">{formatTime(ts)}</p>
        <p className="mt-1 text-sm font-medium text-gray-400">{formatRelativeDay(ts)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-bold text-gray-900">{meeting.title}</h3>
          <StatusChip status={meeting.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-5 text-sm font-medium text-gray-400">
          <span className="flex items-center gap-2"><User className="h-4 w-4" /> Host: You</span>
          <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {duration}</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Up to {meeting.max_participants}</span>
          <span className="font-mono text-gray-300">{meeting.meeting_code}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {joinable && (
          <button
            onClick={onJoin}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0E72ED] px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0966d9] hover:shadow-md hover:-translate-y-px cursor-pointer"
          >
            {meeting.status === "live" ? "Join" : "Start"}
          </button>
        )}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
            aria-label="Meeting options"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-44 rounded-xl border border-[#ececec] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)] animate-scale-in" role="menu">
              {meeting.status === "scheduled" && (
                <button onClick={() => { setOpen(false); onEdit(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              )}
              <button onClick={() => { setOpen(false); onCopy(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <LinkIcon className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
              </button>
              <button onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
function MeetingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialFilter = ((): FilterKey => {
    const f = params.get("filter");
    return FILTERS.some((x) => x.key === f) ? (f as FilterKey) : "all";
  })();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Meeting | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await meetingsApi.getMeetings();
      setMeetings(res.items);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load meetings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toDelete) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !isDeleting) setToDelete(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toDelete, isDeleting]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: meetings.length, upcoming: 0, live: 0, past: 0 };
    for (const m of meetings) {
      if (m.status === "scheduled") c.upcoming++;
      else if (m.status === "live") c.live++;
      else c.past++;
    }
    return c;
  }, [meetings]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings
      .filter((m) => matchesFilter(m, filter))
      .filter((m) => !q || m.title.toLowerCase().includes(q) || m.meeting_code.toLowerCase().includes(q));
  }, [meetings, filter, query]);

  const copyLink = (m: Meeting) => {
    navigator.clipboard?.writeText(`${window.location.origin}/room/${m.meeting_code}`).catch(() => {});
    setCopiedId(m.id);
    setTimeout(() => setCopiedId((id) => (id === m.id ? null : id)), 1600);
  };

  const confirmDelete = async () => {
    if (!toDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await meetingsApi.deleteMeeting(toDelete.id);
      setToDelete(null);
      await load();
    } catch {
      /* keep dialog open on failure */
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pt-8 pb-16 lg:px-8 md:pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">My Meetings</h1>
          <p className="mt-1.5 text-base text-gray-500">Browse and manage every meeting you host or attend.</p>
        </div>
        <button
          onClick={() => router.push("/schedule")}
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0966d9] hover:shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Schedule meeting
        </button>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer",
                filter === f.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800",
              )}
            >
              {f.label}
              <span className={cn("rounded-full px-1.5 text-xs font-bold", filter === f.key ? "bg-gray-100 text-gray-500" : "text-gray-400")}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
            <Search className="h-[18px] w-[18px]" />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or code…"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10"
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-5">
        {isLoading ? (
          <div className="surface-card divide-y divide-gray-100 overflow-hidden" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-6 p-5">
                <div className="w-28 shrink-0 space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-12" /></div>
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-52" /><Skeleton className="h-3 w-72 max-w-full" /></div>
                <Skeleton className="h-9 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-base font-semibold text-red-800">Couldn’t load meetings</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="surface-card flex flex-col items-center justify-center gap-3 p-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50"><CalendarX2 className="h-6 w-6 text-gray-300" /></span>
            <p className="text-base font-semibold text-gray-700">No meetings here</p>
            <p className="text-sm text-gray-400">{query ? "Try a different search." : "Schedule or start a meeting to get going."}</p>
          </div>
        ) : (
          <div className="surface-card divide-y divide-gray-100 overflow-hidden">
            {visible.map((m) => (
              <MeetingListRow
                key={m.id}
                meeting={m}
                copied={copiedId === m.id}
                onJoin={() => router.push(`/room/${m.meeting_code}`)}
                onEdit={() => router.push(`/schedule?id=${m.id}`)}
                onCopy={() => copyLink(m)}
                onDelete={() => setToDelete(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => !isDeleting && setToDelete(null)} aria-hidden />
          <div className="surface-card relative z-10 w-full max-w-sm animate-fade-in p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">Delete meeting?</h2>
                <p className="mt-1 text-sm text-gray-500">“{toDelete.title}” will be permanently removed.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button autoFocus onClick={() => setToDelete(null)} disabled={isDeleting} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer disabled:opacity-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isDeleting} className="inline-flex h-10 min-w-[90px] items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-90 cursor-pointer">{isDeleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={null}>
      <MeetingsContent />
    </Suspense>
  );
}
