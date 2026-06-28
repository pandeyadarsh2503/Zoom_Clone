"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Home, Video, Calendar, Users, Settings, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Meetings", href: "/meetings", icon: Video },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

function ZoomLogo() {
  return (
    <span className="text-2xl font-bold lowercase leading-none tracking-tight text-[#0E72ED] select-none">
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
    <aside className="hidden h-full w-[72px] shrink-0 flex-col border-r border-gray-200/80 bg-white transition-[width] duration-200 md:flex lg:w-[240px]">
      {/* Logo — 72px to align with the navbar height */}
      <div className="flex h-[72px] shrink-0 items-center justify-center border-b border-gray-100 px-4 lg:justify-start lg:px-6">
        <Link href="/" aria-label="Zoom home">
          <ZoomLogo />
        </Link>
      </div>

      {/* Navigation (top) */}
      <nav className="flex flex-col gap-2 p-4" aria-label="Main navigation">
        <p className="hidden px-2 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-400 lg:block">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex h-12 items-center gap-3 rounded-xl px-3 outline-none transition-all duration-150",
                "justify-center lg:justify-start",
                isActive
                  ? "bg-[#EAF2FE] font-semibold text-[#0E72ED]"
                  : "font-medium text-gray-500 hover:bg-gray-100/70 hover:text-gray-900",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#0E72ED] lg:block" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-[#0E72ED]" : "text-gray-400 group-hover:text-gray-600",
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span className="hidden text-base lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Flexible spacer */}
      <div className="flex-1" />

      {/* Upgrade card (anchored near bottom) */}
      <div className="px-4">
        <div className="hidden flex-col gap-3 rounded-2xl border border-[#ececec] bg-gradient-to-br from-[#F5F9FF] to-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E72ED]/10 text-[#0E72ED]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-800">Upgrade your plan</h4>
            <p className="text-sm leading-snug text-gray-500">
              More meetings, storage, and advanced features.
            </p>
          </div>
          <Link
            href="/billing"
            className="text-sm font-bold text-[#0E72ED] transition-colors hover:text-[#0966d9] outline-none cursor-pointer text-left"
          >
            Upgrade now →
          </Link>
        </div>
      </div>

      {/* User profile (anchored at bottom) */}
      <div className="border-t border-gray-100 p-3">
        <button
          className="flex w-full items-center gap-3 rounded-xl p-2 outline-none transition-colors hover:bg-gray-100/70 cursor-pointer justify-center lg:justify-start"
          aria-label="Account"
        >
          <span className="relative shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] text-sm font-bold text-white shadow-sm">
              {initials}
            </span>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-white" />
          </span>
          <span className="hidden min-w-0 flex-1 text-left lg:block">
            <span className="block truncate text-sm font-semibold leading-tight text-gray-800">
              {displayName}
            </span>
            <span className="block truncate text-sm leading-tight text-gray-400">Free plan</span>
          </span>
          <Settings className="hidden h-4 w-4 shrink-0 text-gray-400 lg:block" />
        </button>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-200 bg-white/95 px-4 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex w-14 flex-col items-center justify-center gap-1 transition-colors",
              isActive ? "text-[#0E72ED]" : "text-gray-400",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
