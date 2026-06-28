"use client";

import React, { useState, useRef, useEffect } from "react";
import { Settings, Bell, Search, HelpCircle, User as UserIcon, LogOut } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/store/userStore";
import { usersApi } from "@/lib/api/users";
import { getInitials } from "@/lib/utils";

export function Navbar() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  // States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Hardware states (mock)
  const [microphone, setMicrophone] = useState("System Default Microphone");
  const [camera, setCamera] = useState("Webcam (Integrated)");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditProfile = () => {
    if (user) {
      setDisplayName(user.display_name);
      setAvatarUrl(user.avatar_url || "");
    }
    setIsProfileDropdownOpen(false);
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    try {
      const updated = await usersApi.updateMe({
        display_name: displayName,
        avatar_url: avatarUrl || undefined,
      });
      setUser(updated);
      setIsEditProfileOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user ? getInitials(user.display_name) : "DU";

  return (
    <header className="flex h-16 items-center justify-between bg-white/95 backdrop-blur px-6 border-b border-gray-100 z-30">
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
        {/* ⌘K shortcut badge */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 tracking-wide pointer-events-none select-none shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
          ⌘K
        </span>
      </div>
      <div className="sm:hidden" />

      {/* Right control buttons */}
      <div className="flex items-center gap-1.5">
        {/* Notifications (Bell + count badge) */}
        <button
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all relative outline-none"
          aria-label="Notifications — 3 unread"
        >
          <Bell className="h-[19px] w-[19px]" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-[#FF3B30] text-[9px] font-bold text-white ring-2 ring-white tabular-nums">
            3
          </span>
        </button>

        {/* Help */}
        <button
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all outline-none"
          aria-label="Help"
        >
          <HelpCircle className="h-[19px] w-[19px]" />
        </button>

        {/* Divider */}
        <span className="mx-1.5 h-6 w-px bg-gray-200" aria-hidden />


        {/* Profile Avatar Trigger (Default Zoom Purple badge) */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] hover:opacity-90 ring-2 ring-transparent hover:ring-[#7B46F2]/20 outline-none cursor-pointer shadow-sm transition-all"
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="true"
            >
              <span className="text-[12px] font-bold text-white tracking-wide">
                {initials}
              </span>
            </button>

            {/* Online status indicator (green dot) */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-white pointer-events-none" />

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-[#ececec] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)] animate-scale-in z-50">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Profile</p>
                  <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{user.display_name}</p>
                  <p className="text-xs text-gray-500 truncate">default_user@zoom.clone</p>
                </div>

                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors outline-none cursor-pointer"
                >
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-xs">Edit Profile</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors outline-none cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-xs">Preferences</span>
                </button>

                <div className="h-[1px] bg-gray-100 my-1" />

                <button
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:text-red-700 hover:bg-red-50/50 transition-colors outline-none cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-semibold text-xs">Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Profile Skeleton */
          <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse" />
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
        description="Preferences and hardware setup."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              Audio input
            </label>
            <select
              value={microphone}
              onChange={(e) => setMicrophone(e.target.value)}
              className="w-full text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 focus:outline-none focus:border-[#0E72ED]"
            >
              <option value="System Default Microphone">System Default Microphone</option>
              <option value="Built-in Microphone">Internal Mic (Realtek High Definition)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
              Video source
            </label>
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full text-sm rounded-lg bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 focus:outline-none focus:border-[#0E72ED]"
            >
              <option value="Webcam (Integrated)">Webcam (Integrated Camera)</option>
              <option value="Virtual Camera Source">OBS Virtual Camera</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Profile Settings"
        description="Modify default user account information."
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Display Name"
            placeholder="e.g. Default User"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <Input
            label="Avatar URL (Optional)"
            placeholder="https://example.com/avatar.jpg"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditProfileOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
