"use client";

/**
 * Settings — real profile editing (PATCH /users/me) plus UI-only preferences.
 *
 * Profile changes persist to the backend and update the global user store so
 * the sidebar/navbar reflect them immediately. Device + notification controls
 * are local UI state (no hardware/notification backend in this build).
 */

import { useEffect, useMemo, useState } from "react";
import { User as UserIcon, Mic, Video, Volume2, Bell, Check, AlertCircle } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { usersApi } from "@/lib/api/users";
import { cn, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none cursor-pointer",
        checked ? "bg-[#0E72ED]" : "bg-gray-300",
      )}
    >
      <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E72ED]/10 text-[#0E72ED]">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const selectClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-all focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10 cursor-pointer";

export default function SettingsPage() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Device + notification preferences (local UI only).
  const [mic, setMic] = useState("System Default Microphone");
  const [camera, setCamera] = useState("Integrated Webcam");
  const [speaker, setSpeaker] = useState("System Default Speakers");
  const [notifReminders, setNotifReminders] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifJoin, setNotifJoin] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.display_name);
      setAvatar(user.avatar_url ?? "");
    }
  }, [user]);

  // Load saved device + notification preferences.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zc.prefs");
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.mic) setMic(p.mic);
      if (p.camera) setCamera(p.camera);
      if (p.speaker) setSpeaker(p.speaker);
      if (typeof p.notifReminders === "boolean") setNotifReminders(p.notifReminders);
      if (typeof p.notifChat === "boolean") setNotifChat(p.notifChat);
      if (typeof p.notifJoin === "boolean") setNotifJoin(p.notifJoin);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist preferences whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem("zc.prefs", JSON.stringify({ mic, camera, speaker, notifReminders, notifChat, notifJoin }));
    } catch {
      /* ignore */
    }
  }, [mic, camera, speaker, notifReminders, notifChat, notifJoin]);

  const initials = useMemo(() => (name ? getInitials(name) : "U"), [name]);
  const dirty = user ? name.trim() !== user.display_name || (avatar.trim() || "") !== (user.avatar_url ?? "") : false;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await usersApi.updateMe({ display_name: name.trim(), avatar_url: avatar.trim() || undefined });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn’t save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[760px] px-6 pt-8 pb-16 lg:px-8 md:pb-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1.5 text-base text-gray-500">Manage your profile, devices, and notifications.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Profile */}
        <Section icon={<UserIcon className="h-5 w-5" />} title="Profile" description="This is how you appear across the app.">
          {!user ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-11 w-full rounded-xl" /></div>
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#7B46F2] to-[#5B7CFA] text-xl font-bold text-white">
                  {avatar.trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    initials
                  )}
                </span>
                <div className="text-sm text-gray-500">
                  <p className="font-semibold text-gray-800">{name || "Your name"}</p>
                  <p>Free plan</p>
                </div>
              </div>

              <div>
                <label htmlFor="s-name" className="mb-2 block text-sm font-semibold text-gray-700">Display name</label>
                <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className={cn(selectClass, "cursor-text")} placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="s-avatar" className="mb-2 block text-sm font-semibold text-gray-700">Avatar URL <span className="font-normal text-gray-400">(optional)</span></label>
                <input id="s-avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} className={cn(selectClass, "cursor-text font-mono text-xs")} placeholder="https://…" />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                {saved && <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><Check className="h-4 w-4" /> Saved</span>}
                <button type="submit" disabled={!dirty || !name.trim() || saving} className="inline-flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0966d9] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {saving ? <Spinner size="sm" className="text-white" /> : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </Section>

        {/* Audio & Video */}
        <Section icon={<Video className="h-5 w-5" />} title="Audio & Video" description="Choose your default devices for meetings.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Mic className="h-4 w-4 text-gray-400" /> Microphone</label>
              <select value={mic} onChange={(e) => setMic(e.target.value)} className={selectClass}>
                <option>System Default Microphone</option>
                <option>Headset Microphone</option>
                <option>Internal Mic (Realtek)</option>
              </select>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Volume2 className="h-4 w-4 text-gray-400" /> Speaker</label>
              <select value={speaker} onChange={(e) => setSpeaker(e.target.value)} className={selectClass}>
                <option>System Default Speakers</option>
                <option>Headphones</option>
                <option>External Speakers</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"><Video className="h-4 w-4 text-gray-400" /> Camera</label>
              <select value={camera} onChange={(e) => setCamera(e.target.value)} className={selectClass}>
                <option>Integrated Webcam</option>
                <option>External USB Camera</option>
                <option>OBS Virtual Camera</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={<Bell className="h-5 w-5" />} title="Notifications" description="Decide what you want to be notified about.">
          <div className="divide-y divide-gray-100">
            {[
              { label: "Meeting reminders", desc: "Get notified before a scheduled meeting starts.", v: notifReminders, set: () => setNotifReminders((x) => !x) },
              { label: "Chat messages", desc: "Notify me when I receive a message in a meeting.", v: notifChat, set: () => setNotifChat((x) => !x) },
              { label: "Participant joined", desc: "Alert me when someone joins my meeting.", v: notifJoin, set: () => setNotifJoin((x) => !x) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{row.label}</p>
                  <p className="text-sm text-gray-500">{row.desc}</p>
                </div>
                <Toggle checked={row.v} onChange={row.set} label={row.label} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
