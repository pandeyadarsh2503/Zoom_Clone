"use client";

import React, { useState } from "react";
import { Settings, Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/store/userStore";
import { usersApi } from "@/lib/api/users";

export function Navbar() {
  const { user, setUser } = useUserStore((state) => ({
    user: state.user,
    setUser: state.setUser,
  }));

  // Modals visibility state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Profile Edit fields
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Settings mock states (placeholders)
  const [microphone, setMicrophone] = useState("Default Microphone");
  const [camera, setCamera] = useState("Default Camera (720p)");
  const [theme, setTheme] = useState("Dark Mode");

  const openProfileModal = () => {
    if (user) {
      setDisplayName(user.display_name);
      setAvatarUrl(user.avatar_url || "");
    }
    setIsProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSavingProfile(true);
    try {
      const updatedUser = await usersApi.updateMe({
        display_name: displayName,
        avatar_url: avatarUrl || undefined,
      });
      setUser(updatedUser);
      setIsProfileOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0d0d12]/80 px-6 backdrop-blur-sm">
      {/* Left side — Search Bar */}
      <div className="relative w-64 hidden md:block">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search meetings, contacts..."
          className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-4 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>
      <div className="md:hidden" />

      {/* Right side — Notification, Settings, Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon (Mock) */}
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Settings Icon */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-white/10" />

        {/* User Identity Profile Trigger */}
        {user ? (
          <button
            onClick={openProfileModal}
            className="flex items-center gap-3 hover:opacity-85 text-left transition-opacity focus:outline-none"
          >
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-200 leading-tight">
                {user.display_name}
              </p>
              <p className="text-xs text-slate-500 leading-tight">Host user</p>
            </div>
            <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
          </button>
        ) : (
          /* Skeleton loader */
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-8 w-24 rounded-md bg-white/5 hidden sm:block" />
            <div className="h-8 w-8 rounded-full bg-white/5" />
          </div>
        )}
      </div>

      {/* Settings Modal (Placeholder content) */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
        description="Configure your hardware and client preferences."
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Audio (Microphone)
            </label>
            <select
              value={microphone}
              onChange={(e) => setMicrophone(e.target.value)}
              className="w-full text-sm rounded-lg bg-white/5 border border-white/10 text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Default Microphone" className="bg-[#14141c]">System Default Microphone</option>
              <option value="Built-in Mic" className="bg-[#14141c]">Internal Microphone (Realtek)</option>
              <option value="External Headset" className="bg-[#14141c]">USB Audio Interface / Headset</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Video (Camera)
            </label>
            <select
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              className="w-full text-sm rounded-lg bg-white/5 border border-white/10 text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Default Camera (720p)" className="bg-[#14141c]">Integrated HD Webcam (720p)</option>
              <option value="High-Res Camera (1080p)" className="bg-[#14141c]">External Web Camera (1080p)</option>
              <option value="Virtual Camera" className="bg-[#14141c]">OBS Virtual Camera</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Theme & Interface
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full text-sm rounded-lg bg-white/5 border border-white/10 text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="Dark Mode" className="bg-[#14141c]">Dark (Deep Obsidian)</option>
              <option value="Light Mode" className="bg-[#14141c]">Light (Zoom Classic - Coming Soon)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <Button variant="secondary" onClick={() => setIsSettingsOpen(false)}>
              Close Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Profile Settings"
        description="Update your default display properties."
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Display Name"
            placeholder="e.g. Adarsh Pandey"
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

          <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsProfileOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSavingProfile}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
