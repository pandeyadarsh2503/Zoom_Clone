import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Dashboard",
};

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#14141c] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

// ── Quick action card ──────────────────────────────────────────────────────

function QuickAction({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex cursor-pointer items-center gap-4 rounded-xl border border-white/5 bg-[#14141c] p-5 transition-colors hover:border-blue-500/30 hover:bg-blue-500/5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 transition-colors group-hover:bg-blue-600/30">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

// ── SVG Icons ──────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here's what's happening."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Total Meetings" value="0" description="No meetings scheduled yet" />
        <StatCard label="Recordings" value="0" description="No recordings available" />
        <StatCard label="Hours in Calls" value="0" description="Start your first meeting" />
      </div>

      {/* Quick actions */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickAction
          icon={<PlusIcon />}
          title="New Meeting"
          description="Start an instant video call"
        />
        <QuickAction
          icon={<LinkIcon />}
          title="Join Meeting"
          description="Enter a meeting code to join"
        />
        <QuickAction
          icon={<CalendarIcon />}
          title="Schedule"
          description="Plan a meeting for later"
        />
      </div>

      {/* Recent meetings placeholder */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Upcoming Meetings
        </h2>
        <div className="rounded-xl border border-white/5 bg-[#14141c] p-10 text-center">
          <p className="text-slate-500 text-sm">No upcoming meetings.</p>
          <p className="text-slate-600 text-xs mt-1">
            Create a meeting to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
