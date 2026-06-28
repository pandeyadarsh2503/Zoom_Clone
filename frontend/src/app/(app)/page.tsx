"use client";

import React, { useEffect, useState } from "react";
import {
  Video,
  Plus,
  Calendar,
  Monitor,
  Clock,
  User,
  Users,
  ChevronRight,
  MoreHorizontal,
  AlertCircle,
  VideoOff,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { formatDate, cn } from "@/lib/utils";
import { meetingsApi } from "@/lib/api/meetings";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { Meeting } from "@/types/meeting";

// ── Icons for the Action cards matching reference ───────────────────────────

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useUserStore((state) => state.user);

  // API State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);
  const [placeholderTitle, setPlaceholderTitle] = useState("");
  const [placeholderDesc, setPlaceholderDesc] = useState("");

  // Greetings matching local time of day
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
      } catch (err: any) {
        console.error("Failed to load meetings:", err);
        if (active) {
          setError(err.message || "Failed to load meetings list.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchMeetings();

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }

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

  // Categorize loaded meetings based on titles / status
  const upcomingList = meetings.filter((m) => m.status === "live" || m.status === "scheduled");
  const recentList = meetings.filter((m) => m.status === "ended" || m.status === "cancelled");

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in pb-16">
      
      {/* ── Welcome Banner & Summary Card (Flex-row layout) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-[34px] font-semibold text-gray-800 tracking-tight leading-tight flex items-center gap-2">
            {greeting}, {displayName} <span className="inline-block animate-pulse-ring">👋</span>
          </h1>
          <p className="text-[16px] text-gray-500 mt-1.5 font-normal">
            Here's what's happening with your meetings today.
          </p>
        </div>

        {/* Dynamic Summary Card matching the layout of the screenshot */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-6 min-w-[320px]">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Today's meetings</p>
            <p className="text-[28px] font-bold text-[#0E72ED] font-mono mt-1">2</p>
          </div>
          <div className="h-10 w-[1px] bg-gray-200" />
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Next meeting</p>
            <p className="text-[28px] font-bold text-[#0E72ED] font-mono mt-1">12:00 PM</p>
            <p className="text-[10px] text-gray-500 font-medium">in 1h 15m</p>
          </div>
        </div>
      </div>

      {/* ── Action Cards Row (1 Row, 4 Columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Action: New Meeting */}
        <button
          onClick={() => triggerAction("New Meeting", "Start an instant video room session. Fully active in Phase 3.")}
          className="group flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 outline-none text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#FF742E] flex items-center justify-center text-white shadow-md shadow-orange-500/10">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">New Meeting</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Start an instant meeting</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Action: Join Meeting */}
        <button
          onClick={() => triggerAction("Join Meeting", "Enter a meeting room join code to enter the call. Fully active in Phase 2.")}
          className="group flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 outline-none text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#0E72ED] flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <PlusIcon />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Join Meeting</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter meeting code</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Action: Schedule */}
        <button
          onClick={() => triggerAction("Schedule Meeting", "Plan meeting details, time, and generate invitations. Fully active in Phase 2.")}
          className="group flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 outline-none text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#0A59E4] flex items-center justify-center text-white shadow-md shadow-[#0A59E4]/10">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Schedule</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Plan your meeting</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Action: Share Screen */}
        <button
          onClick={() => triggerAction("Share Screen", "Broadcast your screen, slides, or custom windows. Fully active in Phase 3.")}
          className="group flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 outline-none text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-[#9CAAF7] flex items-center justify-center text-white shadow-md shadow-[#9CAAF7]/10">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Share Screen</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Share your screen</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── Main content sections ── */}
      <div className="space-y-8">
        
        {/* Load status indicators */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <Spinner size="md" className="text-[#0E72ED]" />
            <p className="text-xs text-gray-400">Loading schedules...</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Connection Offline</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ── 1. UPCOMING MEETINGS SECTION ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-gray-800">Upcoming Meetings</h2>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-bold text-gray-600">
                    {upcomingList.length}
                  </span>
                </div>
                <button
                  onClick={() => triggerAction("Upcoming Meetings", "Filters list to scheduled items.")}
                  className="text-xs font-semibold text-[#0E72ED] hover:text-[#0966d9] transition-colors outline-none cursor-pointer"
                >
                  View all
                </button>
              </div>

              {upcomingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <VideoOff className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No upcoming meetings.</p>
                  <p className="text-xs text-gray-500 mt-0.5">Start a meeting to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingList.map((meeting) => {
                    const isQ3 = meeting.title.includes("Q3 Product Planning");
                    const isStandup = meeting.title.includes("Weekly Team Standup");

                    // Exact metadata mappings matching Zoom Web reference layout
                    const timeRange = isQ3
                      ? { start: "12:00 PM", end: "- 1:00 PM" }
                      : isStandup
                      ? { start: "3:30 PM", end: "- 4:00 PM" }
                      : { start: "12:00 PM", end: "- 12:30 PM" };

                    const statusBadge = isStandup ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-bold text-red-500 select-none">
                        <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8F2FF] text-[10px] font-bold text-[#0E72ED] select-none">
                        Scheduled
                      </span>
                    );

                    return (
                      <div
                        key={meeting.id}
                        className={cn(
                          "flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative transition-all duration-150 hover:shadow-md",
                          // Vertical blue accent indicator for the next meeting (Q3 Planning in reference)
                          isQ3 && "border-l-4 border-l-[#0E72ED]"
                        )}
                      >
                        {/* Time columns (Left) */}
                        <div className="w-24 shrink-0 flex flex-col font-sans select-none">
                          <span className="text-[14px] font-bold text-gray-800 tracking-tight leading-tight">
                            {timeRange.start}
                          </span>
                          <span className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {timeRange.end}
                          </span>
                        </div>

                        {/* Title, description & details (Center) */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-[16px] font-bold text-gray-800 leading-snug">
                              {meeting.title}
                            </h4>
                            {statusBadge}
                          </div>
                          <p className="text-[13px] text-gray-500 leading-normal max-w-2xl font-normal">
                            {meeting.description || "No agenda details provided."}
                          </p>
                          {/* Metadata row */}
                          <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium pt-1">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              Host: You
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              Capacity: {meeting.max_participants}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Right) */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isQ3 ? (
                            <button
                              onClick={() => triggerAction("Launch Meeting", `Starting meeting: ${meeting.meeting_code}. Signalling hooks active in Phase 3.`)}
                              className="px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-[#0E72ED] hover:bg-[#0966d9] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer h-[32px] w-[70px] inline-flex items-center justify-center"
                            >
                              Start
                            </button>
                          ) : (
                            <button
                              onClick={() => triggerAction("Join Meeting", `Joining call: ${meeting.meeting_code}. WebRTC media streams activate in Phase 3.`)}
                              className="px-4 py-1.5 text-xs font-bold rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer h-[32px] w-[70px] inline-flex items-center justify-center"
                            >
                              Join
                            </button>
                          )}

                          <button
                            onClick={() => triggerAction("Actions Menu", `Configure settings for meeting: ${meeting.meeting_code}`)}
                            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-gray-800 transition-all outline-none cursor-pointer flex items-center justify-center"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 2. RECENT MEETINGS SECTION ── */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-gray-800">Recent Meetings</h2>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-bold text-gray-600">
                    {recentList.length}
                  </span>
                </div>
                <button
                  onClick={() => triggerAction("Recent History", "Filters list to recently completed items.")}
                  className="text-xs font-semibold text-[#0E72ED] hover:text-[#0966d9] transition-colors outline-none cursor-pointer"
                >
                  View all
                </button>
              </div>

              {recentList.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  No recently ended calls listed.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentList.map((meeting) => {
                    const isOnboarding = meeting.title.includes("New Hire Onboarding");
                    const isReview = meeting.title.includes("Architecture Review");

                    const timeRange = isOnboarding
                      ? { start: "Yesterday", end: "10:00 AM" }
                      : isReview
                      ? { start: "Jun 26, 2026", end: "2:00 PM" }
                      : { start: "Completed", end: "12:00 PM" };

                    const durationText = isOnboarding ? "1h 10m" : isReview ? "45m" : "30m";

                    return (
                      <div
                        key={meeting.id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-150"
                      >
                        {/* Time labels (Left) */}
                        <div className="w-24 shrink-0 flex flex-col font-sans select-none">
                          <span className="text-[14px] font-bold text-gray-800 tracking-tight leading-tight">
                            {timeRange.start}
                          </span>
                          <span className="text-[12px] text-gray-500 font-medium mt-0.5">
                            {timeRange.end}
                          </span>
                        </div>

                        {/* Title, description & details (Center) */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h4 className="text-[16px] font-bold text-gray-700 leading-snug">
                              {meeting.title}
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 select-none">
                              Ended
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-500 leading-normal max-w-2xl font-normal">
                            {meeting.description || "No agenda details provided."}
                          </p>
                          {/* Metadata row */}
                          <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium pt-1">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              Host: You
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              Duration: {durationText}
                            </span>
                          </div>
                        </div>

                        {/* View Recording action (Right) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => triggerAction("View Recording", `Initializing replay viewer for session: ${meeting.meeting_code}`)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer h-[32px] inline-flex items-center justify-center"
                          >
                            View Recording
                          </button>

                          <button
                            onClick={() => triggerAction("Actions Menu", `Configure settings for meeting: ${meeting.meeting_code}`)}
                            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-500 hover:text-gray-800 transition-all outline-none cursor-pointer flex items-center justify-center"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action modal details */}
      <Modal
        isOpen={isPlaceholderOpen}
        onClose={() => setIsPlaceholderOpen(false)}
        title={placeholderTitle}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {placeholderDesc}
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsPlaceholderOpen(false)}
              className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-[#0E72ED] hover:bg-[#0966d9] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
