"use client";

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
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide select-none";

  if (status === "live") {
    return (
      <span className={cn(base, "bg-[#FFE9E7] text-[#E5372A] uppercase")}>
        <span className="h-1.5 w-1.5 rounded-full bg-[#E5372A] animate-pulse-ring" />
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

// ── Action card ─────────────────────────────────────────────────────────────

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

function ActionCard({ title, subtitle, icon, gradient, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group surface-card lift-hover flex items-center justify-between p-5 text-left outline-none cursor-pointer focus-visible:ring-4 focus-visible:ring-[#0E72ED]/15"
    >
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md shrink-0 transition-transform duration-200 group-hover:scale-105",
            gradient,
          )}
        >
          {icon}
        </span>
        <div>
          <h3 className="text-[14px] font-bold text-gray-800 leading-tight">{title}</h3>
          <p className="text-[11.5px] text-gray-500 mt-0.5 leading-tight">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder modal (preserves existing phased-rollout behaviour)
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);
  const [placeholderTitle, setPlaceholderTitle] = useState("");
  const [placeholderDesc, setPlaceholderDesc] = useState("");

  const [greeting, setGreeting] = useState("Good afternoon");

  useEffect(() => {
    let active = true;
    const fetchMeetings = async () => {
      try {
        const response = await meetingsApi.getMeetings();
        if (active) {
          setMeetings(response.items);
          setError(null);
        }
      } catch (err: unknown) {
        console.error("Failed to load meetings:", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load meetings list.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchMeetings();

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

  const displayName = user?.display_name || "Default User";
  const firstName = displayName.split(" ")[0];

  // ── Derived, data-driven groupings ──────────────────────────────
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

  // Stats computed from real meeting timestamps.
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
    <div className="max-w-[1180px] mx-auto px-6 lg:px-8 py-7 space-y-7 animate-fade-in pb-20">
      {/* ── Hero ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-[30px] sm:text-[34px] font-bold text-gray-900 tracking-tight leading-tight flex items-center gap-2.5">
            {greeting}, {firstName}
            <span className="inline-block animate-pulse-ring">👋</span>
          </h1>
          <p className="text-[15px] text-gray-500 mt-1.5">
            Manage your meetings effortlessly.
          </p>
        </div>

        {/* Stat card — real data */}
        <div className="surface-card flex items-stretch divide-x divide-gray-100 min-w-[300px]">
          <div className="flex-1 px-5 py-4">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
              Today
            </p>
            <p className="text-[26px] font-bold text-gray-900 leading-none mt-1.5">
              {todayCount}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              {todayCount === 1 ? "meeting" : "meetings"}
            </p>
          </div>
          <div className="flex-1 px-5 py-4">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">
              Next
            </p>
            <p className="text-[26px] font-bold text-[#0E72ED] leading-none mt-1.5 font-mono tabular-nums">
              {nextMeeting
                ? formatTime(
                    nextMeeting.started_at ??
                      nextMeeting.scheduled_at ??
                      nextMeeting.created_at,
                  )
                : "—"}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              {nextMeeting
                ? nextMeeting.status === "live"
                  ? "Live now"
                  : formatRelativeDay(
                      nextMeeting.scheduled_at ??
                        nextMeeting.started_at ??
                        nextMeeting.created_at,
                    )
                : "Nothing scheduled"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          title="New Meeting"
          subtitle="Start an instant meeting"
          icon={<Video className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-[#FF8A4C] to-[#FF5630]"
          onClick={() => triggerAction("New Meeting", "Start an instant video room. Fully active in Phase 3.")}
        />
        <ActionCard
          title="Join Meeting"
          subtitle="Enter a meeting code"
          icon={<PlusIcon />}
          gradient="bg-gradient-to-br from-[#2D8CFF] to-[#0E72ED]"
          onClick={() => triggerAction("Join Meeting", "Enter a meeting code to join a call. Fully active in Phase 2.")}
        />
        <ActionCard
          title="Schedule"
          subtitle="Plan a meeting ahead"
          icon={<Calendar className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-[#6E8BFF] to-[#3D5AFE]"
          onClick={() => triggerAction("Schedule Meeting", "Plan meeting details, time, and invitations. Fully active in Phase 2.")}
        />
        <ActionCard
          title="My Meetings"
          subtitle="View all your meetings"
          icon={<CalendarRange className="h-5 w-5" />}
          gradient="bg-gradient-to-br from-[#A06BFF] to-[#7B46F2]"
          onClick={() => triggerAction("My Meetings", "Browse and manage every meeting you host or attend. Fully active in Phase 2.")}
        />
      </div>

      {/* ── States ── */}
      {isLoading && (
        <div className="surface-card flex flex-col items-center justify-center p-14 gap-3">
          <Spinner size="md" className="text-[#0E72ED]" />
          <p className="text-xs text-gray-400">Loading your meetings…</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Connection offline</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-8">
          {/* ── Upcoming ── */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-bold text-gray-900">Upcoming Meetings</h2>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[11px] font-bold text-gray-500">
                  {upcomingList.length}
                </span>
              </div>
              <button
                onClick={() => triggerAction("Upcoming Meetings", "A filtered view of your scheduled and live meetings.")}
                className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#0E72ED] hover:text-[#0966d9] transition-colors outline-none cursor-pointer"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {upcomingList.length === 0 ? (
              <div className="surface-card flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <CalendarX2 className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No upcoming meetings</p>
                <p className="text-xs text-gray-400 mt-1">Start or schedule a meeting to see it here.</p>
              </div>
            ) : (
              <div className="surface-card overflow-hidden divide-y divide-gray-100">
                {upcomingList.map((meeting, index) => {
                  const start =
                    meeting.started_at ?? meeting.scheduled_at ?? meeting.created_at;
                  const isPrimary = index === 0;
                  return (
                    <div
                      key={meeting.id}
                      className={cn(
                        "flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 sm:p-6 transition-colors duration-150 hover:bg-[#FAFBFC]",
                        isPrimary && "border-l-[3px] border-l-[#0E72ED]",
                      )}
                    >
                      {/* Time */}
                      <div className="w-[104px] shrink-0 select-none">
                        <p className="text-[15px] font-bold text-gray-900 leading-tight tabular-nums">
                          {formatTime(start)}
                        </p>
                        <p className="text-[12px] text-gray-400 font-medium mt-0.5">
                          {formatRelativeDay(start)}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-[15.5px] font-bold text-gray-900 leading-snug">
                            {meeting.title}
                          </h4>
                          <StatusChip status={meeting.status} />
                        </div>
                        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
                          {meeting.description || "No agenda details provided."}
                        </p>
                        <div className="flex items-center gap-4 text-[11.5px] text-gray-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Host: You
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" /> Up to {meeting.max_participants}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            triggerAction(
                              meeting.status === "live" ? "Join Meeting" : "Start Meeting",
                              `${meeting.status === "live" ? "Joining" : "Starting"} "${meeting.title}" (${meeting.meeting_code}). Live media activates in Phase 3.`,
                            )
                          }
                          className={cn(
                            "h-9 px-4 text-[13px] font-bold rounded-lg inline-flex items-center justify-center transition-all duration-150 cursor-pointer",
                            isPrimary
                              ? "text-white bg-[#0E72ED] hover:bg-[#0966d9] shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0"
                              : "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm",
                          )}
                        >
                          {meeting.status === "live" ? "Join" : "Start"}
                        </button>
                        <button
                          onClick={() => triggerAction("Meeting Options", `Manage settings for "${meeting.title}".`)}
                          className="h-9 w-9 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all outline-none cursor-pointer flex items-center justify-center"
                          aria-label="Meeting options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Recent ── */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[17px] font-bold text-gray-900">Recent Meetings</h2>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[11px] font-bold text-gray-500">
                  {recentList.length}
                </span>
              </div>
              <button
                onClick={() => triggerAction("Recent History", "A filtered view of your completed and cancelled meetings.")}
                className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#0E72ED] hover:text-[#0966d9] transition-colors outline-none cursor-pointer"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {recentList.length === 0 ? (
              <div className="surface-card p-8 text-center text-xs text-gray-400">
                No recent meetings yet.
              </div>
            ) : (
              <div className="surface-card overflow-hidden divide-y divide-gray-100">
                {recentList.map((meeting) => {
                  const ts =
                    meeting.ended_at ?? meeting.scheduled_at ?? meeting.created_at;
                  const duration =
                    meeting.started_at && meeting.ended_at
                      ? formatDuration(meeting.started_at, meeting.ended_at)
                      : null;
                  return (
                    <div
                      key={meeting.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 sm:p-6 transition-colors duration-150 hover:bg-[#FAFBFC]"
                    >
                      {/* Time */}
                      <div className="w-[104px] shrink-0 select-none">
                        <p className="text-[14px] font-bold text-gray-700 leading-tight">
                          {formatRelativeDay(ts)}
                        </p>
                        <p className="text-[12px] text-gray-400 font-medium mt-0.5 tabular-nums">
                          {formatTime(ts)}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-[15.5px] font-bold text-gray-700 leading-snug">
                            {meeting.title}
                          </h4>
                          <StatusChip status={meeting.status} />
                        </div>
                        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
                          {meeting.description || "No agenda details provided."}
                        </p>
                        <div className="flex items-center gap-4 text-[11.5px] text-gray-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Host: You
                          </span>
                          {duration && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" /> {duration}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() =>
                            triggerAction(
                              meeting.status === "ended" ? "View Recording" : "Meeting Details",
                              `Opening "${meeting.title}" (${meeting.meeting_code}).`,
                            )
                          }
                          className="h-9 px-3.5 text-[13px] font-bold rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer inline-flex items-center justify-center"
                        >
                          {meeting.status === "ended" ? "View Recording" : "Details"}
                        </button>
                        <button
                          onClick={() => triggerAction("Meeting Options", `Manage settings for "${meeting.title}".`)}
                          className="h-9 w-9 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all outline-none cursor-pointer flex items-center justify-center"
                          aria-label="Meeting options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Placeholder modal */}
      <Modal
        isOpen={isPlaceholderOpen}
        onClose={() => setIsPlaceholderOpen(false)}
        title={placeholderTitle}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">{placeholderDesc}</p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsPlaceholderOpen(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#0E72ED] hover:bg-[#0966d9] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
