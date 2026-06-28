"use client";

/**
 * Dashboard — recomposed on a single 12-column grid.
 *
 * Design system (used throughout, nothing off-scale):
 *   Spacing : 8 · 12 · 16 · 24 · 32 · 48 · 64   (gap-2/3/4/6/8/12/16, p-2…p-16)
 *   Type    : 14 · 16 · 18 · 24 · 36            (text-sm / base / lg / 2xl / 4xl)
 *   Surface : .surface-card  →  16px radius · #ECECEC border · soft shadow
 *
 * Every band is an item on the same `grid-cols-12` track, so all sections
 * share one content width and align to the same columns.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Video,
  Plus,
  Calendar,
  CalendarRange,
  Clock,
  User,
  Users,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  CalendarX2,
  ArrowUpRight,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { cn, formatTime, formatRelativeDay, formatDuration, isToday } from "@/lib/utils";
import { meetingsApi } from "@/lib/api/meetings";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { Meeting, MeetingStatus } from "@/types/meeting";

// ── Status chip ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: MeetingStatus }) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold leading-none select-none";

  if (status === "live") {
    return (
      <span className={cn(base, "bg-[#FFE9E7] text-[#E5372A]")}>
        <span className="h-2 w-2 rounded-full bg-[#E5372A] animate-pulse-ring" />
        Live
      </span>
    );
  }
  if (status === "scheduled") {
    return <span className={cn(base, "bg-[#E8F2FF] text-[#0E72ED]")}>Scheduled</span>;
  }
  if (status === "ended") {
    return <span className={cn(base, "bg-gray-100 text-gray-500")}>Ended</span>;
  }
  return <span className={cn(base, "bg-[#FFF4E5] text-[#B7791F]")}>Cancelled</span>;
}

// ── Section header (heading + count + view-all) ─────────────────────────────

function SectionHeader({
  title,
  count,
  onViewAll,
}: {
  title: string;
  count: number;
  onViewAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-sm font-bold text-gray-500">
          {count}
        </span>
      </div>
      <button
        onClick={onViewAll}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#0E72ED] hover:text-[#0966d9] transition-colors outline-none cursor-pointer"
      >
        View all <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Action card (four equal, same height via the grid) ──────────────────────

function ActionCard({
  title,
  subtitle,
  icon,
  gradient,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group surface-card lift-hover flex h-full w-full items-center gap-4 p-6 text-left outline-none cursor-pointer focus-visible:ring-4 focus-visible:ring-[#0E72ED]/15"
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-md transition-transform duration-200 group-hover:scale-105",
          gradient,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-gray-900 leading-tight">{title}</span>
        <span className="mt-2 block text-sm text-gray-500 leading-tight">{subtitle}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function PlusGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Meeting row ─────────────────────────────────────────────────────────────

function MeetingRow({
  meeting,
  primaryTime,
  secondaryTime,
  meta,
  emphasized,
  action,
  onAction,
  onOptions,
}: {
  meeting: Meeting;
  primaryTime: string;
  secondaryTime: string;
  meta: React.ReactNode;
  emphasized?: boolean;
  action: { label: string; primary: boolean };
  onAction: () => void;
  onOptions: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-6 transition-colors duration-150 hover:bg-[#FAFBFC] md:flex-row md:items-center md:gap-6",
        emphasized && "border-l-[3px] border-l-[#0E72ED]",
      )}
    >
      {/* Time — fixed track so every row aligns */}
      <div className="w-24 shrink-0 select-none">
        <p className="text-base font-bold text-gray-900 leading-tight tabular-nums">{primaryTime}</p>
        <p className="mt-2 text-sm font-medium text-gray-400">{secondaryTime}</p>
      </div>

      {/* Detail */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-bold text-gray-900 leading-snug">{meeting.title}</h3>
          <StatusChip status={meeting.status} />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 leading-relaxed">
          {meeting.description || "No agenda details provided."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-6 text-sm font-medium text-gray-400">{meta}</div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onAction}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-all duration-150 cursor-pointer",
            action.primary
              ? "bg-[#0E72ED] text-white shadow-sm hover:bg-[#0966d9] hover:shadow-md hover:-translate-y-px active:translate-y-0"
              : "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm",
          )}
        >
          {action.label}
        </button>
        <button
          onClick={onOptions}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 outline-none cursor-pointer"
          aria-label="Meeting options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);
  const [placeholderTitle, setPlaceholderTitle] = useState("");
  const [placeholderDesc, setPlaceholderDesc] = useState("");

  const [greeting, setGreeting] = useState("Good afternoon");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await meetingsApi.getMeetings();
        if (active) {
          setMeetings(response.items);
          setError(null);
        }
      } catch (err: unknown) {
        console.error("Failed to load meetings:", err);
        if (active) setError(err instanceof Error ? err.message : "Failed to load meetings.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    return () => {
      active = false;
    };
  }, []);

  const triggerAction = (title: string, desc: string) => {
    setPlaceholderTitle(title);
    setPlaceholderDesc(desc);
    setIsPlaceholderOpen(true);
  };

  const firstName = (user?.display_name || "Default User").split(" ")[0];

  const upcomingList = useMemo(
    () => meetings.filter((m) => m.status === "live" || m.status === "scheduled"),
    [meetings],
  );
  const recentList = useMemo(
    () => meetings.filter((m) => m.status === "ended" || m.status === "cancelled"),
    [meetings],
  );

  const startKey = (m: Meeting) =>
    new Date(m.started_at ?? m.scheduled_at ?? m.created_at).getTime();

  const todayCount = useMemo(
    () =>
      meetings.filter((m) => {
        const ts = m.started_at ?? m.scheduled_at;
        return ts ? isToday(ts) : false;
      }).length,
    [meetings],
  );

  const nextMeeting = useMemo(
    () => [...upcomingList].sort((a, b) => startKey(a) - startKey(b))[0],
    [upcomingList],
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pt-8 pb-16 lg:px-8 md:pb-8">
      {/* One grid · 12 columns · 24px column gap · 32px row gap */}
      <div className="grid grid-cols-12 gap-x-6 gap-y-8">
        {/* ── Hero ───────────────────────────────────────────── */}
        <header className="col-span-12 flex flex-col justify-center gap-3 lg:col-span-8">
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-gray-900 leading-none">
            {greeting}, {firstName}
            <span className="inline-block animate-pulse-ring">👋</span>
          </h1>
          <p className="text-base text-gray-500">Manage your meetings effortlessly.</p>
        </header>

        {/* Summary card */}
        <div className="surface-card col-span-12 flex items-stretch divide-x divide-gray-100 lg:col-span-4">
          <div className="flex-1 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Today</p>
            <p className="mt-3 text-2xl font-bold text-gray-900 leading-none">{todayCount}</p>
            <p className="mt-2 text-sm font-medium text-gray-400">
              {todayCount === 1 ? "meeting" : "meetings"}
            </p>
          </div>
          <div className="flex-1 p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Next</p>
            <p className="mt-3 text-2xl font-bold text-[#0E72ED] leading-none tabular-nums">
              {nextMeeting
                ? formatTime(nextMeeting.started_at ?? nextMeeting.scheduled_at ?? nextMeeting.created_at)
                : "—"}
            </p>
            <p className="mt-2 text-sm font-medium text-gray-400">
              {nextMeeting
                ? nextMeeting.status === "live"
                  ? "Live now"
                  : formatRelativeDay(
                      nextMeeting.scheduled_at ?? nextMeeting.started_at ?? nextMeeting.created_at,
                    )
                : "Nothing scheduled"}
            </p>
          </div>
        </div>

        {/* ── Action cards — four equal columns ──────────────── */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <ActionCard
            title="New Meeting"
            subtitle="Start an instant meeting"
            icon={<Video className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-[#FF8A4C] to-[#FF5630]"
            onClick={() => triggerAction("New Meeting", "Start an instant video room. Fully active in Phase 3.")}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <ActionCard
            title="Join Meeting"
            subtitle="Enter a meeting code"
            icon={<PlusGlyph />}
            gradient="bg-gradient-to-br from-[#2D8CFF] to-[#0E72ED]"
            onClick={() => triggerAction("Join Meeting", "Enter a meeting code to join a call. Fully active in Phase 2.")}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <ActionCard
            title="Schedule"
            subtitle="Plan a meeting ahead"
            icon={<Calendar className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-[#6E8BFF] to-[#3D5AFE]"
            onClick={() => triggerAction("Schedule Meeting", "Plan meeting details, time, and invitations. Fully active in Phase 2.")}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <ActionCard
            title="My Meetings"
            subtitle="View all your meetings"
            icon={<CalendarRange className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-[#A06BFF] to-[#7B46F2]"
            onClick={() => triggerAction("My Meetings", "Browse and manage every meeting you host or attend. Fully active in Phase 2.")}
          />
        </div>

        {/* ── Loading / error states ─────────────────────────── */}
        {isLoading && (
          <div className="surface-card col-span-12 flex flex-col items-center justify-center gap-3 p-16">
            <Spinner size="md" className="text-[#0E72ED]" />
            <p className="text-sm text-gray-400">Loading your meetings…</p>
          </div>
        )}

        {error && (
          <div className="col-span-12 flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-base font-semibold text-red-800">Couldn’t load meetings</p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* ── Upcoming ───────────────────────────────────────── */}
        {!isLoading && !error && (
          <section className="col-span-12 flex flex-col gap-4">
            <SectionHeader
              title="Upcoming Meetings"
              count={upcomingList.length}
              onViewAll={() => triggerAction("Upcoming Meetings", "A filtered view of your scheduled and live meetings.")}
            />

            {upcomingList.length === 0 ? (
              <div className="surface-card flex flex-col items-center justify-center gap-3 p-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                  <CalendarX2 className="h-6 w-6 text-gray-300" />
                </span>
                <p className="text-base font-semibold text-gray-700">No upcoming meetings</p>
                <p className="text-sm text-gray-400">Start or schedule a meeting to see it here.</p>
              </div>
            ) : (
              <div className="surface-card divide-y divide-gray-100 overflow-hidden">
                {upcomingList.map((meeting, index) => {
                  const start = meeting.started_at ?? meeting.scheduled_at ?? meeting.created_at;
                  return (
                    <MeetingRow
                      key={meeting.id}
                      meeting={meeting}
                      primaryTime={formatTime(start)}
                      secondaryTime={formatRelativeDay(start)}
                      emphasized={index === 0}
                      action={{ label: meeting.status === "live" ? "Join" : "Start", primary: index === 0 }}
                      meta={
                        <>
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Host: You
                          </span>
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Up to {meeting.max_participants}
                          </span>
                        </>
                      }
                      onAction={() =>
                        triggerAction(
                          meeting.status === "live" ? "Join Meeting" : "Start Meeting",
                          `${meeting.status === "live" ? "Joining" : "Starting"} "${meeting.title}" (${meeting.meeting_code}). Live media activates in Phase 3.`,
                        )
                      }
                      onOptions={() => triggerAction("Meeting Options", `Manage settings for "${meeting.title}".`)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Recent ─────────────────────────────────────────── */}
        {!isLoading && !error && (
          <section className="col-span-12 flex flex-col gap-4">
            <SectionHeader
              title="Recent Meetings"
              count={recentList.length}
              onViewAll={() => triggerAction("Recent History", "A filtered view of your completed and cancelled meetings.")}
            />

            {recentList.length === 0 ? (
              <div className="surface-card p-12 text-center text-sm text-gray-400">No recent meetings yet.</div>
            ) : (
              <div className="surface-card divide-y divide-gray-100 overflow-hidden">
                {recentList.map((meeting) => {
                  const ts = meeting.ended_at ?? meeting.scheduled_at ?? meeting.created_at;
                  const duration =
                    meeting.started_at && meeting.ended_at
                      ? formatDuration(meeting.started_at, meeting.ended_at)
                      : null;
                  return (
                    <MeetingRow
                      key={meeting.id}
                      meeting={meeting}
                      primaryTime={formatRelativeDay(ts)}
                      secondaryTime={formatTime(ts)}
                      action={{ label: meeting.status === "ended" ? "View Recording" : "Details", primary: false }}
                      meta={
                        <>
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Host: You
                          </span>
                          {duration && (
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4" /> {duration}
                            </span>
                          )}
                        </>
                      }
                      onAction={() =>
                        triggerAction(
                          meeting.status === "ended" ? "View Recording" : "Meeting Details",
                          `Opening "${meeting.title}" (${meeting.meeting_code}).`,
                        )
                      }
                      onOptions={() => triggerAction("Meeting Options", `Manage settings for "${meeting.title}".`)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Placeholder modal */}
      <Modal isOpen={isPlaceholderOpen} onClose={() => setIsPlaceholderOpen(false)} title={placeholderTitle} size="sm">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-600">{placeholderDesc}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsPlaceholderOpen(false)}
              className="rounded-lg bg-[#0E72ED] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0966d9] cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
