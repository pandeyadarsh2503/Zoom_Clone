"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
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
    <span className="text-[26px] font-bold tracking-tight text-[#0E72ED] font-sans leading-none lowercase select-none">
      zoom
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);

  const displayName = user?.display_name ?? "Default User";
  const initials = user ? getInitials(user.display_name) : "DU";

  return (
    <aside className="hidden md:flex flex-col h-full bg-white border-r border-gray-200/80 shrink-0 w-[76px] lg:w-[248px] transition-all duration-200 justify-between">
      <div className="flex flex-col min-h-0">
        {/* Logo */}
        <div className="flex h-16 items-center px-4 lg:px-6 border-b border-gray-100 justify-center lg:justify-start">
          <Link href="/" aria-label="Zoom home">
            <ZoomLogo />
          </Link>
        </div>

        {/* Section label (full layout only) */}
        <p className="hidden lg:block px-6 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
          Menu
        </p>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-3 lg:px-3 pt-3 lg:pt-0" aria-label="Main navigation">
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
                  "group relative flex items-center rounded-xl transition-all duration-150 outline-none",
                  "h-[42px] justify-center lg:justify-start px-3 gap-3",
                  isActive
                    ? "bg-[#EAF2FE] text-[#0E72ED] font-semibold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/70 font-medium"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active accent rail (full layout) */}
                {isActive && (
                  <span className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#0E72ED]" />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-[#0E72ED]" : "text-gray-400 group-hover:text-gray-600"
                  )}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <span className="text-[13.5px] hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom region */}
      <div className="flex flex-col gap-3 p-3">
        {/* Upgrade callout (full layout only) */}
        <div className="hidden lg:flex flex-col p-4 rounded-2xl border border-[#ececec] bg-gradient-to-br from-[#F5F9FF] to-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#0E72ED]/10 flex items-center justify-center text-[#0E72ED]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-gray-800">Upgrade your plan</h4>
            <p className="text-[10.5px] text-gray-500 leading-relaxed">
              More meetings, cloud storage, and advanced features.
            </p>
          </div>
          <button
            onClick={() => window.open("#upgrade", "_self")}
            className="mt-1 text-[11px] font-bold text-[#0E72ED] hover:text-[#0966d9] text-left transition-colors outline-none cursor-pointer"
          >
            Upgrade now →
          </button>
        </div>

        {/* Profile section */}
        <button
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-100/70 transition-colors outline-none cursor-pointer justify-center lg:justify-start"
          aria-label="Account"
        >
          <span className="relative shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] text-[11px] font-bold text-white tracking-wide shadow-sm">
              {initials}
            </span>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
          </span>
          <div className="hidden lg:block text-left min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-gray-400 truncate leading-tight">
              Free plan
            </p>
          </div>
          <Settings className="hidden lg:block h-4 w-4 text-gray-400 shrink-0" />
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur border-t border-gray-200 flex items-center justify-around px-4 z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
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
              isActive ? "text-[#0E72ED]" : "text-gray-400"
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
