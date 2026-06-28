"use client";

/**
 * Calendar — a month grid that places your real meetings on their dates.
 *
 * Meetings come from the same API as the dashboard; each is bucketed onto its
 * scheduled (or started/ended) day. The view month is initialised on the client
 * after mount to avoid a server/client date hydration mismatch.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { meetingsApi } from "@/lib/api/meetings";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Meeting, MeetingStatus } from "@/types/meeting";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_DOT: Record<MeetingStatus, string> = {
  scheduled: "bg-[#0E72ED]",
  live: "bg-[#E5372A]",
  ended: "bg-gray-400",
  cancelled: "bg-amber-500",
};

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function meetingDate(m: Meeting): Date {
  return new Date(m.scheduled_at ?? m.started_at ?? m.ended_at ?? m.created_at);
}

export default function CalendarPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const [today, setToday] = useState<{ year: number; month: number; day: number } | null>(null);

  // Initialise on the client only — avoids a Date() hydration mismatch.
  useEffect(() => {
    const now = new Date();
    setView({ year: now.getFullYear(), month: now.getMonth() });
    setToday({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
  }, []);

  useEffect(() => {
    let active = true;
    meetingsApi.getMeetings().then((r) => { if (active) setMeetings(r.items); }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Bucket meetings by local date.
  const byDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) {
      const d = meetingDate(m);
      const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      (map.get(key) ?? map.set(key, []).get(key)!).push(m);
    }
    return map;
  }, [meetings]);

  const goToday = useCallback(() => {
    const now = new Date();
    setView({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const step = (delta: number) => {
    setView((v) => {
      if (!v) return v;
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  // Build the 6x7 grid of cells.
  const cells = useMemo(() => {
    if (!view) return [];
    const firstWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out: { day: number; inMonth: boolean; key: string }[] = [];
    // leading days (prev month)
    const prevDays = new Date(view.year, view.month, 0).getDate();
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pm = view.month === 0 ? 11 : view.month - 1;
      const py = view.month === 0 ? view.year - 1 : view.year;
      out.push({ day: d, inMonth: false, key: dateKey(py, pm, d) });
    }
    for (let d = 1; d <= daysInMonth; d++) out.push({ day: d, inMonth: true, key: dateKey(view.year, view.month, d) });
    // trailing days to fill the final week
    let nd = 1;
    while (out.length % 7 !== 0) {
      const nm = view.month === 11 ? 0 : view.month + 1;
      const ny = view.month === 11 ? view.year + 1 : view.year;
      out.push({ day: nd, inMonth: false, key: dateKey(ny, nm, nd) });
      nd++;
    }
    return out;
  }, [view]);

  const monthMeetingCount = useMemo(() => {
    if (!view) return 0;
    return meetings.filter((m) => {
      const d = meetingDate(m);
      return d.getFullYear() === view.year && d.getMonth() === view.month;
    }).length;
  }, [meetings, view]);

  const isToday = (key: string) => today && key === dateKey(today.year, today.month, today.day);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pt-8 pb-16 lg:px-8 md:pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Calendar</h1>
          <p className="mt-1.5 text-base text-gray-500">
            {view ? <>{monthMeetingCount} meeting{monthMeetingCount === 1 ? "" : "s"} this month.</> : "Loading…"}
          </p>
        </div>
        <button onClick={() => router.push("/schedule")} className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0966d9] hover:shadow-md cursor-pointer">
          <Plus className="h-4 w-4" /> Schedule meeting
        </button>
      </div>

      {/* Month controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 tabular-nums">
            {view ? `${MONTHS[view.month]} ${view.year}` : "—"}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 cursor-pointer" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => step(1)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 cursor-pointer" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <button onClick={goToday} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 cursor-pointer">
          <CalendarDays className="h-3.5 w-3.5" /> Today
        </button>
      </div>

      {/* Grid */}
      <div className="surface-card mt-4 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-[#FAFBFC]">
          {WEEKDAYS.map((w) => (
            <div key={w} className="px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-gray-400">{w}</div>
          ))}
        </div>

        {!view ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[104px] border-b border-r border-gray-100 p-2"><Skeleton className="h-5 w-5 rounded-md" /></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const items = byDay.get(cell.key) ?? [];
              const todayCell = isToday(cell.key);
              return (
                <div key={i} className={cn("min-h-[104px] border-b border-r border-gray-100 p-2 transition-colors", cell.inMonth ? "bg-white hover:bg-[#FAFBFC]" : "bg-[#FCFCFD]")}>
                  <div className="flex items-center justify-between">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums", todayCell ? "bg-[#0E72ED] text-white" : cell.inMonth ? "text-gray-700" : "text-gray-300")}>{cell.day}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 2).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => router.push(m.status === "scheduled" || m.status === "live" ? `/room/${m.meeting_code}` : "/meetings")}
                        className="flex w-full items-center gap-1.5 rounded-md bg-gray-50 px-1.5 py-1 text-left transition hover:bg-gray-100 cursor-pointer"
                        title={m.title}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[m.status])} />
                        <span className="truncate text-[11px] font-medium text-gray-700">{m.title}</span>
                      </button>
                    ))}
                    {items.length > 2 && (
                      <button onClick={() => router.push("/meetings")} className="px-1.5 text-[11px] font-semibold text-[#0E72ED] hover:underline cursor-pointer">
                        +{items.length - 2} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {([["scheduled", "Scheduled"], ["live", "Live"], ["ended", "Ended"], ["cancelled", "Cancelled"]] as [MeetingStatus, string][]).map(([s, label]) => (
          <span key={s} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} /> {label}</span>
        ))}
      </div>
    </div>
  );
}
