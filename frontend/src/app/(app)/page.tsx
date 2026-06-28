"use client";

import React, { useEffect, useState } from "react";
import {
  Video,
  Plus,
  Calendar,
  Monitor,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  VideoOff,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { meetingsApi } from "@/lib/api/meetings";
import { formatDate } from "@/lib/utils";
import type { Meeting } from "@/types/meeting";

export default function DashboardPage() {
  // Live clock state
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  // Meetings states
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Placeholder modal states
  const [placeholderTitle, setPlaceholderTitle] = useState("");
  const [placeholderDesc, setPlaceholderDesc] = useState("");
  const [isPlaceholderOpen, setIsPlaceholderOpen] = useState(false);

  // Real-time Clock effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch meetings on mount
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
    return () => {
      active = false;
    };
  }, []);

  // Copy join link helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Trigger placeholder dialog
  const triggerPlaceholder = (title: string, desc: string) => {
    setPlaceholderTitle(title);
    setPlaceholderDesc(desc);
    setIsPlaceholderOpen(true);
  };

  // Split meetings into categories (No dummy arrays used!)
  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" || m.status === "live"
  );
  const recentMeetings = meetings.filter(
    (m) => m.status === "ended" || m.status === "cancelled"
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Top Banner: Welcome & Clock Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-blue-900/40 via-surface-950 to-slate-900/30 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-slate-400 text-sm max-w-md">
              Create instant meetings, join scheduled calls, or view past session summaries directly from your dashboard.
            </p>
          </div>
          {/* Zoom Web style dynamic clock card */}
          <div className="bg-black/35 backdrop-blur-md rounded-xl border border-white/10 p-5 min-w-[240px] text-center md:text-right shrink-0">
            <p className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight select-all">
              {time || "00:00:00 AM"}
            </p>
            <p className="mt-1 text-slate-400 text-xs font-medium tracking-wide">
              {date || "Loading calendar date..."}
            </p>
          </div>
        </div>
        {/* Subtle decorative background gradient circles */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-purple-500/10 blur-[60px]" />
      </div>

      {/* Grid: Actions Panel (Left) & Meetings Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Quick Meeting Controls (Col 5) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <button
            onClick={() =>
              triggerPlaceholder(
                "New Meeting",
                "Start an instant high-definition video call. Video rooms and WebRTC peers will be wired in Phase 3."
              )
            }
            className="group flex flex-col justify-between items-start text-left rounded-2xl border border-orange-500/10 bg-orange-600/10 p-5 h-40 hover:border-orange-500/30 hover:bg-orange-600/15 transition-all select-none duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-900/30 group-hover:scale-105 transition-transform duration-200">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-orange-200">New Meeting</p>
              <p className="text-xs text-orange-400/80 mt-1">Start an instant room</p>
            </div>
          </button>

          <button
            onClick={() =>
              triggerPlaceholder(
                "Join Meeting",
                "Enter a 10-character code (e.g. abc-defg-hij) to participate. Joining logic will be active in Phase 2."
              )
            }
            className="group flex flex-col justify-between items-start text-left rounded-2xl border border-blue-500/10 bg-blue-600/10 p-5 h-40 hover:border-blue-500/30 hover:bg-blue-600/15 transition-all select-none duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform duration-200">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-blue-200">Join Meeting</p>
              <p className="text-xs text-blue-400/80 mt-1">Enter a meeting code</p>
            </div>
          </button>

          <button
            onClick={() =>
              triggerPlaceholder(
                "Schedule Meeting",
                "Select date, set duration, and plan a calendar invitation. Scheduling features will be active in Phase 2."
              )
            }
            className="group flex flex-col justify-between items-start text-left rounded-2xl border border-violet-500/10 bg-violet-600/10 p-5 h-40 hover:border-violet-500/30 hover:bg-violet-600/15 transition-all select-none duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <div className="h-12 w-12 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-lg shadow-violet-900/30 group-hover:scale-105 transition-transform duration-200">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-violet-200">Schedule</p>
              <p className="text-xs text-violet-400/80 mt-1">Plan calendar event</p>
            </div>
          </button>

          <button
            onClick={() =>
              triggerPlaceholder(
                "Share Screen",
                "Share your primary screen or a specific window to present documents. Active during call sessions in Phase 3."
              )
            }
            className="group flex flex-col justify-between items-start text-left rounded-2xl border border-slate-500/15 bg-white/5 p-5 h-40 hover:border-blue-500/20 hover:bg-white/10 transition-all select-none duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform duration-200">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200">Share Screen</p>
              <p className="text-xs text-slate-400/80 mt-1">Broadcast slides/video</p>
            </div>
          </button>
        </div>

        {/* Right Column: Dynamic Meetings Sections (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main loader or error display */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14141c] p-12 gap-3">
              <Spinner size="lg" className="text-blue-500" />
              <p className="text-sm text-slate-500">Retrieving meetings list from API...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">API Connection Issue</p>
                <p className="text-xs text-red-400/80 mt-1">{error}</p>
                <p className="text-xs text-slate-500 mt-2">Make sure your FastAPI server is running on port 8000.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {/* 1. UPCOMING MEETINGS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Upcoming & Live ({upcomingMeetings.length})
                  </h2>
                </div>

                {upcomingMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14141c] p-8 text-center">
                    <VideoOff className="h-8 w-8 text-slate-700 mb-2" />
                    <p className="text-slate-500 text-sm">No scheduled meetings.</p>
                    <p className="text-slate-600 text-xs mt-0.5">
                      Schedule a meeting to plan ahead.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#14141c] p-4 hover:border-white/10 hover:bg-[#181822] transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-200">
                              {meeting.title}
                            </p>
                            {meeting.status === "live" ? (
                              <Badge label="LIVE" variant="live" dot />
                            ) : (
                              <Badge label="Scheduled" variant="default" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {meeting.description || "No agenda details provided."}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 pt-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {meeting.scheduled_at
                                ? formatDate(meeting.scheduled_at)
                                : "Ad-hoc / Instant"}
                            </span>
                          </div>
                        </div>

                        {/* Copy Code & Launch Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyCode(meeting.meeting_code)}
                            className="p-2 rounded-lg text-slate-400 border border-white/5 bg-white/5 hover:text-slate-200 hover:bg-white/10 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === meeting.meeting_code ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          <Button
                            size="sm"
                            variant={meeting.status === "live" ? "primary" : "secondary"}
                            rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
                            onClick={() =>
                              triggerPlaceholder(
                                "Launch Call",
                                `This would route you to /room/${meeting.meeting_code}. Audio, video, and WebRTC signalling rooms are configured in Phase 3.`
                              )
                            }
                          >
                            {meeting.status === "live" ? "Join" : "Start"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. RECENT MEETINGS */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Recent History ({recentMeetings.length})
                </h2>

                {recentMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#14141c] p-6 text-center">
                    <p className="text-slate-600 text-xs">No recent meetings logs.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/5 bg-[#14141c]/50 p-4"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-400">
                              {meeting.title}
                            </p>
                            {meeting.status === "ended" ? (
                              <Badge label="Ended" variant="success" />
                            ) : (
                              <Badge label="Cancelled" variant="danger" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-1">
                            {meeting.description || "No agenda provided."}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {meeting.started_at
                                ? `Ran on ${formatDate(meeting.started_at)}`
                                : meeting.scheduled_at
                                ? `Scheduled for ${formatDate(meeting.scheduled_at)}`
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Meeting Code Read-only */}
                        <span className="font-mono text-xs text-slate-600 bg-white/5 rounded px-2 py-1 select-all shrink-0">
                          {meeting.meeting_code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Placeholder Modal (Handles actions since they are out of scope for this task) */}
      <Modal
        isOpen={isPlaceholderOpen}
        onClose={() => setIsPlaceholderOpen(false)}
        title={placeholderTitle}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            {placeholderDesc}
          </p>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setIsPlaceholderOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
