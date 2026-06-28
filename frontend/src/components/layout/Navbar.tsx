"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useUserStore } from "@/store/userStore";

// ── Component ──────────────────────────────────────────────────────────────

export function Navbar() {
  const user = useUserStore((state) => state.user);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0d0d12]/80 px-6 backdrop-blur-sm">
      {/* Left — page breadcrumb slot (kept empty; PageHeader owns titles) */}
      <div />

      {/* Right — user identity */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200 leading-tight">
                {user.display_name}
              </p>
              <p className="text-xs text-slate-500 leading-tight">Default user</p>
            </div>
            <Avatar
              src={user.avatar_url}
              name={user.display_name}
              size="sm"
            />
          </>
        ) : (
          /* Skeleton while the user is loading */
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-24 rounded-md bg-white/5 hidden sm:block" />
            <div className="h-8 w-8 rounded-full bg-white/5" />
          </div>
        )}
      </div>
    </header>
  );
}
