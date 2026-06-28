"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Video, Calendar, Users, Settings, Sparkles } from "lucide-react";

// ── Nav items definition matching the Zoom reference ──────────────────────────

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Meetings", href: "/meetings", icon: Video },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

function ZoomLogo() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      {/* Zoom Camera SVG Icon */}
      <svg className="h-6 w-6 text-[#0E72ED]" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill="#0E72ED" />
        <path d="M25 15.5L20.5 19V15C20.5 13.9 19.6 13 18.5 13H11.5C10.4 13 9.5 13.9 9.5 15V21C9.5 22.1 10.4 23 11.5 23H18.5C19.6 23 20.5 22.1 20.5 21V17L25 20.5V15.5Z" fill="white" />
      </svg>
      {/* Zoom Wordmark */}
      <span className="text-[21px] font-bold tracking-tight text-[#0E72ED] font-sans">
        zoom
      </span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-full bg-white border-r border-gray-200 shrink-0 w-[72px] lg:w-60 transition-all duration-150 justify-between">
      <div className="flex flex-col">
        {/* Logo Section */}
        <div className="flex h-16 items-center px-4 lg:px-6 border-b border-gray-100 gap-3 justify-center lg:justify-start">
          <Link href="/">
            <ZoomLogo />
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex flex-col gap-1 p-3 pt-4" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-150 outline-none",
                  "h-10 justify-center lg:justify-start px-3 gap-3",
                  isActive
                    ? "bg-[#E8F2FF] text-[#0E72ED]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#0E72ED]" : "text-gray-500")} />
                <span className="text-[14px] font-semibold hidden lg:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade Callout Card & Version Info */}
      <div className="p-4 flex flex-col gap-3">
        {/* Promo card shown only on full layout */}
        <div className="hidden lg:flex flex-col p-4 bg-gradient-to-br from-white to-blue-50/20 border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0E72ED]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-gray-800">Upgrade your plan</h4>
            <p className="text-[10px] text-gray-500 leading-normal">
              Get more meetings, cloud storage, and advanced features.
            </p>
          </div>
          <button
            onClick={() => window.open("#upgrade", "_self")}
            className="text-[11px] font-bold text-[#0E72ED] hover:text-[#0966d9] text-left transition-colors outline-none cursor-pointer mt-1"
          >
            Upgrade now
          </button>
        </div>

        <div className="flex justify-center lg:justify-start lg:px-2 select-none">
          <p className="text-[10px] text-gray-400 font-medium">
            v{process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0"}
          </p>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around px-4 z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 w-14 transition-colors",
              isActive ? "text-[#0E72ED]" : "text-gray-500"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-semibold">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
