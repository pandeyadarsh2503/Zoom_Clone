"use client";

/**
 * Contacts — a directory of people you meet with.
 *
 * UI only: contacts are a static local list (there is no contacts backend in
 * this build). Supports search and a "Start meeting" action that drops you into
 * a room. Designed to match the rest of the app.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Video, MessageSquare, UserPlus, Mail, X } from "lucide-react";
import { cn, getInitials, generateMeetingCode } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string;
  title: string;
  status: "online" | "busy" | "offline";
  accent: string;
}

const CONTACTS: Contact[] = [
  { id: "c1", name: "Sarah Chen", email: "sarah.chen@acme.io", title: "Product Manager", status: "online", accent: "from-rose-500 to-orange-500" },
  { id: "c2", name: "Marcus Lee", email: "marcus.lee@acme.io", title: "Engineering Lead", status: "busy", accent: "from-sky-500 to-indigo-500" },
  { id: "c3", name: "Priya Sharma", email: "priya.sharma@acme.io", title: "UX Designer", status: "online", accent: "from-emerald-500 to-teal-500" },
  { id: "c4", name: "David Park", email: "david.park@acme.io", title: "Data Scientist", status: "offline", accent: "from-amber-500 to-orange-600" },
  { id: "c5", name: "Elena Rossi", email: "elena.rossi@acme.io", title: "Marketing Director", status: "online", accent: "from-fuchsia-500 to-purple-600" },
  { id: "c6", name: "James Wright", email: "james.wright@acme.io", title: "Sales Manager", status: "busy", accent: "from-blue-500 to-cyan-500" },
  { id: "c7", name: "Aisha Khan", email: "aisha.khan@acme.io", title: "QA Engineer", status: "offline", accent: "from-violet-500 to-blue-500" },
  { id: "c8", name: "Tom Becker", email: "tom.becker@acme.io", title: "DevOps Engineer", status: "online", accent: "from-teal-500 to-emerald-600" },
];

const STATUS: Record<Contact["status"], { dot: string; label: string }> = {
  online: { dot: "bg-emerald-500", label: "Available" },
  busy: { dot: "bg-amber-500", label: "Busy" },
  offline: { dot: "bg-gray-300", label: "Offline" },
};

const ADD_ACCENTS = ["from-violet-500 to-blue-500", "from-pink-500 to-rose-500", "from-cyan-500 to-teal-500", "from-amber-500 to-orange-600"];

export default function ContactsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState<Contact[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "" });

  // Load + persist custom contacts.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zc.contacts");
      if (raw) setCustom(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("zc.contacts", JSON.stringify(custom));
    } catch {
      /* ignore */
    }
  }, [custom]);

  const all = useMemo(() => [...custom, ...CONTACTS], [custom]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  }, [query, all]);

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    const c: Contact = {
      id: `u-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim() || "Contact",
      status: "online",
      accent: ADD_ACCENTS[custom.length % ADD_ACCENTS.length],
    };
    setCustom((cs) => [c, ...cs]);
    setForm({ name: "", email: "", title: "" });
    setAddOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 pt-8 pb-16 lg:px-8 md:pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Contacts</h1>
          <p className="mt-1.5 text-base text-gray-500">People you meet with, all in one place.</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0966d9] hover:shadow-md cursor-pointer">
          <UserPlus className="h-4 w-4" /> Add contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-6 w-full sm:max-w-sm">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400"><Search className="h-[18px] w-[18px]" /></span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10"
        />
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="surface-card mt-5 flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300"><Search className="h-6 w-6" /></span>
          <p className="text-base font-semibold text-gray-700">No contacts found</p>
          <p className="text-sm text-gray-400">Try a different search.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <div key={c.id} className="surface-card lift-hover flex flex-col p-5 transition-shadow">
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white", c.accent)}>{getInitials(c.name)}</span>
                  <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white", STATUS[c.status].dot)} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-gray-900">{c.name}</p>
                  <p className="truncate text-sm text-gray-500">{c.title}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.email}</span>
              </div>

              <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-400">
                <span className={cn("h-1.5 w-1.5 rounded-full", STATUS[c.status].dot)} /> {STATUS[c.status].label}
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => router.push(`/room/${generateMeetingCode()}`)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0E72ED] px-3 text-sm font-semibold text-white transition hover:bg-[#0966d9] cursor-pointer"
                >
                  <Video className="h-4 w-4" /> Meet
                </button>
                <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 cursor-pointer" aria-label={`Message ${c.name}`}>
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add contact modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setAddOpen(false)} aria-hidden />
          <div className="surface-card relative z-10 w-full max-w-sm animate-fade-in p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add contact</h2>
              <button onClick={() => setAddOpen(false)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={addContact} className="flex flex-col gap-3">
              <input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10" />
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10" />
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="h-11 rounded-xl border border-gray-200 bg-white px-3.5 text-sm text-gray-800 outline-none focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10" />
              <div className="mt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setAddOpen(false)} className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer">Cancel</button>
                <button type="submit" disabled={!form.name.trim() || !form.email.trim()} className="inline-flex h-10 items-center rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white transition hover:bg-[#0966d9] disabled:opacity-50 cursor-pointer">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
