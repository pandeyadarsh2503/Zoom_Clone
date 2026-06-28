import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meeting Room",
};

// ── Video icon ─────────────────────────────────────────────────────────────

function VideoOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-slate-700" aria-hidden>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

interface RoomPageProps {
  params: Promise<{ meetingCode: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { meetingCode } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <VideoOffIcon />

      <div>
        <h1 className="text-xl font-semibold text-slate-200">Room not started</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Meeting{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
            {meetingCode}
          </code>{" "}
          has not started yet. Video functionality is implemented in Phase 3.
        </p>
      </div>

      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
