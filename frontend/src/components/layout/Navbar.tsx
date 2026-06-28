"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings, Bell, Search, HelpCircle, User as UserIcon, LogOut,
  X, Mic, Video, Volume2, Loader2, Sparkles, Mail, AlertCircle, ChevronRight,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { usersApi } from "@/lib/api/users";
import { getInitials, cn } from "@/lib/utils";
import { getPrefs, savePrefs, type Prefs } from "@/lib/prefs";

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none cursor-pointer focus-visible:ring-4 focus-visible:ring-[#0E72ED]/20",
        on ? "bg-[#0E72ED]" : "bg-gray-200",
      )}
    >
      <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", on ? "translate-x-[22px]" : "translate-x-[2px]")} />
    </button>
  );
}

export function Navbar() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const logout = useUserStore((state) => state.logout);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);

  // Edit-profile form
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preferences (persisted to localStorage)
  const [prefs, setPrefs] = useState<Prefs>(getPrefs);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modals on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsEditProfileOpen(false);
      setIsPrefsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const openEditProfile = () => {
    if (user) {
      setDisplayName(user.display_name);
      setAvatarUrl(user.avatar_url || "");
    }
    setSaveError(null);
    setIsProfileDropdownOpen(false);
    setIsEditProfileOpen(true);
  };

  const openPrefs = () => {
    setPrefs(getPrefs());
    setIsProfileDropdownOpen(false);
    setIsPrefsOpen(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await usersApi.updateMe({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      setUser(updated);
      setIsEditProfileOpen(false);
    } catch {
      setSaveError("Couldn’t save your profile. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePref = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs(next);
    // Turning on desktop notifications asks the browser for permission.
    if (key === "desktopNotifications" && next.desktopNotifications && "Notification" in window) {
      Notification.requestPermission().catch(() => {});
    }
  };

  const initials = user ? getInitials(user.display_name) : "DU";
  const planLabel = user?.plan && user.plan !== "free" ? user.plan : "Free";

  const fieldCls = "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10";

  return (
    <>
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-100 bg-white/95 px-6 backdrop-blur z-30">
      {/* Search box */}
      <div className="relative w-[300px] lg:w-[380px] hidden sm:block group">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 group-focus-within:text-[#0E72ED] transition-colors">
          <Search className="h-[18px] w-[18px]" />
        </span>
        <input
          type="text"
          placeholder="Search meetings, contacts…"
          className="w-full rounded-xl bg-[#f4f5f9] border border-transparent pl-11 pr-16 h-10 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#0E72ED]/30 focus:ring-4 focus:ring-[#0E72ED]/10 transition-all font-medium"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 tracking-wide pointer-events-none select-none shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
          ⌘K
        </span>
      </div>
      <div className="sm:hidden" />

      {/* Right control buttons */}
      <div className="flex items-center gap-1.5">
        <button
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all relative outline-none"
          aria-label="Notifications — 3 unread"
        >
          <Bell className="h-[19px] w-[19px]" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-bold text-white ring-2 ring-white tabular-nums">
            3
          </span>
        </button>

        <button
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all outline-none"
          aria-label="Help"
        >
          <HelpCircle className="h-[19px] w-[19px]" />
        </button>

        <span className="mx-1.5 h-6 w-px bg-gray-200" aria-hidden />

        {/* Profile avatar + dropdown */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] hover:opacity-90 ring-2 ring-transparent hover:ring-[#7B46F2]/20 outline-none cursor-pointer shadow-sm transition-all overflow-hidden"
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="true"
            >
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[12px] font-bold text-white tracking-wide">{initials}</span>
              )}
            </button>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-white pointer-events-none" />

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-[#ececec] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)] animate-scale-in z-50">
                {/* Profile header */}
                <div className="flex items-center gap-3 px-2.5 py-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] text-sm font-bold text-white">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">{user.display_name}</p>
                    <p className="truncate text-xs text-gray-500">{user.email ?? "—"}</p>
                  </div>
                </div>
                <Link href="/billing" onClick={() => setIsProfileDropdownOpen(false)} className="mx-2.5 mb-1.5 flex items-center justify-between rounded-lg bg-gradient-to-r from-[#0E72ED]/10 to-[#7B46F2]/10 px-3 py-1.5 transition hover:from-[#0E72ED]/15 hover:to-[#7B46F2]/15">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700"><Sparkles className="h-3.5 w-3.5 text-[#0E72ED]" /> {planLabel} plan</span>
                  <span className="text-[11px] font-bold text-[#0E72ED]">Upgrade</span>
                </Link>

                <div className="h-px bg-gray-100 my-1" />

                <button onClick={openEditProfile} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors outline-none cursor-pointer">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-[13px]">Edit profile</span>
                </button>
                <button onClick={openPrefs} className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors outline-none cursor-pointer">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-[13px]">Preferences</span>
                </button>

                <div className="h-px bg-gray-100 my-1" />

                <button
                  onClick={() => { setIsProfileDropdownOpen(false); logout(); router.replace("/login"); }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:text-red-700 hover:bg-red-50/50 transition-colors outline-none cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-semibold text-[13px]">Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
        )}
      </div>
      </header>

      {/* ── Edit Profile modal (light) ─────────────────────────── */}
      {isEditProfileOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditProfileOpen(false)} aria-hidden />
          <div className="surface-card relative z-10 w-full max-w-md animate-fade-in p-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Edit profile</h2>
              <button onClick={() => setIsEditProfileOpen(false)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={saveProfile} className="px-6 py-5">
              {/* Avatar preview */}
              <div className="mb-5 flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] text-xl font-bold text-white">
                  {avatarUrl.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    getInitials(displayName || user.display_name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{displayName || user.display_name}</p>
                  <p className="text-xs text-gray-400">This is how you appear across Zoom.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Display name</label>
                  <input autoFocus value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Default User" className={fieldCls} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Avatar URL <span className="font-normal text-gray-400">(optional)</span></label>
                  <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…/avatar.jpg" className={fieldCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Email</label>
                  <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-500">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{user.email ?? "—"}</span>
                    <span className="ml-auto text-[11px] font-medium text-gray-400">Can’t change</span>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {saveError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => setIsEditProfileOpen(false)} disabled={isSaving} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={isSaving || !displayName.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white transition hover:bg-[#0966d9] disabled:opacity-50 cursor-pointer">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preferences modal (light) ──────────────────────────── */}
      {isPrefsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsPrefsOpen(false)} aria-hidden />
          <div className="surface-card relative z-10 w-full max-w-md animate-fade-in p-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
                <p className="text-xs text-gray-400">These apply the next time you join a meeting.</p>
              </div>
              <button onClick={() => setIsPrefsOpen(false)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            <div className="px-6 py-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">When I join a meeting</p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <PrefRow icon={<Mic className="h-[18px] w-[18px]" />} label="Mute my microphone" desc="Join meetings muted" on={prefs.muteOnJoin} onChange={() => updatePref("muteOnJoin")} />
                <PrefRow icon={<Video className="h-[18px] w-[18px]" />} label="Turn off my video" desc="Join with camera off" on={prefs.videoOffOnJoin} onChange={() => updatePref("videoOffOnJoin")} border />
              </div>

              <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-gray-400">Notifications</p>
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <PrefRow icon={<Volume2 className="h-[18px] w-[18px]" />} label="Chat message sound" desc="Play a tone for new messages" on={prefs.chatSound} onChange={() => updatePref("chatSound")} />
                <PrefRow icon={<Bell className="h-[18px] w-[18px]" />} label="Desktop notifications" desc="Alert me outside the tab" on={prefs.desktopNotifications} onChange={() => updatePref("desktopNotifications")} border />
              </div>

              <Link href="/settings" onClick={() => setIsPrefsOpen(false)} className="mt-5 flex items-center justify-between rounded-xl border border-gray-100 px-3.5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                <span className="flex items-center gap-2.5"><Settings className="h-[18px] w-[18px] text-gray-400" /> Open full settings</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>

              <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                <button onClick={() => setIsPrefsOpen(false)} className="inline-flex h-10 items-center rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white transition hover:bg-[#0966d9] cursor-pointer">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Preference row ───────────────────────────────────────────────────────────
function PrefRow({ icon, label, desc, on, onChange, border }: { icon: React.ReactNode; label: string; desc: string; on: boolean; onChange: () => void; border?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 bg-white px-3.5 py-3", border && "border-t border-gray-100")}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
