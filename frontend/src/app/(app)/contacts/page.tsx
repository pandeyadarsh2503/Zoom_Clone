"use client";

/**
 * Contacts — a directory of people you meet with.
 *
 * Backed by the API (`/api/v1/contacts`), scoped to the signed-in user. The
 * `status` dot reflects *live* presence: a contact whose account is currently
 * connected to a meeting shows "online" regardless of its stored value.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Video, Trash2, UserPlus, Mail, X, Loader2 } from "lucide-react";
import { cn, getInitials, generateMeetingCode } from "@/lib/utils";
import { contactsApi, type Contact, type ContactStatus } from "@/lib/api/contacts";
import { ApiError } from "@/lib/api/client";

const STATUS: Record<ContactStatus, { dot: string; label: string }> = {
  online: { dot: "bg-emerald-500", label: "Available" },
  busy: { dot: "bg-amber-500", label: "Busy" },
  offline: { dot: "bg-gray-300", label: "Offline" },
};

const FALLBACK_ACCENT = "from-sky-500 to-indigo-500";

export default function ContactsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "" });
  const [saving, setSaving] = useState(false);

  // Load the directory from the backend.
  useEffect(() => {
    let alive = true;
    contactsApi
      .list()
      .then((res) => alive && setContacts(res.items))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Couldn’t load contacts."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.title ?? "").toLowerCase().includes(q),
    );
  }, [query, contacts]);

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || saving) return;
    setSaving(true);
    try {
      const created = await contactsApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim() || undefined,
      });
      setContacts((cs) => [...cs, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", email: "", title: "" });
      setAddOpen(false);
    } catch {
      /* keep the modal open on failure */
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (id: string) => {
    const prev = contacts;
    setContacts((cs) => cs.filter((c) => c.id !== id)); // optimistic
    try {
      await contactsApi.remove(id);
    } catch {
      setContacts(prev); // rollback
    }
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

      {/* States */}
      {loading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="surface-card h-[168px] p-5">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="skeleton mt-3 h-4 w-2/3 rounded" />
              <div className="skeleton mt-2 h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="surface-card mt-5 p-12 text-center text-sm font-medium text-red-600">{error}</div>
      ) : visible.length === 0 ? (
        <div className="surface-card mt-5 flex flex-col items-center justify-center gap-3 p-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-300"><Search className="h-6 w-6" /></span>
          <p className="text-base font-semibold text-gray-700">{contacts.length === 0 ? "No contacts yet" : "No contacts found"}</p>
          <p className="text-sm text-gray-400">{contacts.length === 0 ? "Add your first contact to get started." : "Try a different search."}</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => (
            <div key={c.id} className="surface-card lift-hover group flex flex-col p-5 transition-shadow">
              <div className="flex items-center gap-3">
                <span className="relative shrink-0">
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white", c.accent ?? FALLBACK_ACCENT)}>{getInitials(c.name)}</span>
                  <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white", STATUS[c.status].dot)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-gray-900">{c.name}</p>
                  <p className="truncate text-sm text-gray-500">{c.title ?? "Contact"}</p>
                </div>
                <button
                  onClick={() => removeContact(c.id)}
                  className="rounded-lg p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 cursor-pointer"
                  aria-label={`Remove ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
                <button type="submit" disabled={!form.name.trim() || !form.email.trim() || saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white transition hover:bg-[#0966d9] disabled:opacity-50 cursor-pointer">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
