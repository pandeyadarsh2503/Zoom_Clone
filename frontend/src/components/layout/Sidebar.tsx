"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Nav item type ──────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function RecordingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <polygon points="22,10 14,16 22,22" fill="white" opacity="0.9" />
      <rect x="8" y="10" width="9" height="12" rx="2" fill="white" />
    </svg>
  );
}

// ── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <HomeIcon className="h-5 w-5" /> },
  { label: "Meetings", href: "/meetings", icon: <VideoIcon className="h-5 w-5" /> },
  { label: "Recordings", href: "/recordings", icon: <RecordingIcon className="h-5 w-5" /> },
];

// ── Component ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-white/5 bg-[#0d0d12]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
        <LogoIcon />
        <span className="text-base font-semibold text-white tracking-tight">
          Zoom Clone
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5",
                "text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3">
        <p className="px-3 text-xs text-slate-600">
          v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0"}
        </p>
      </div>
    </aside>
  );
}
