"use client";

/**
 * Global search — a lightweight command palette in the navbar.
 *
 * Searches across app pages, the user's meetings, and contacts. Opens on focus
 * or ⌘K / Ctrl-K, filters as you type, supports arrow-key navigation, and
 * navigates on Enter/click. Meeting + contact data is fetched lazily on first
 * focus and reused.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Home, Video, Calendar, Users, Settings, CreditCard,
  CornerDownLeft, Hash, UserCircle2,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { meetingsApi } from "@/lib/api/meetings";
import { contactsApi, type Contact } from "@/lib/api/contacts";
import type { Meeting } from "@/types/meeting";

const PAGES = [
  { label: "Home", sub: "Dashboard", href: "/", icon: Home },
  { label: "Meetings", sub: "Manage meetings", href: "/meetings", icon: Video },
  { label: "Calendar", sub: "Your schedule", href: "/calendar", icon: Calendar },
  { label: "Contacts", sub: "Your directory", href: "/contacts", icon: Users },
  { label: "Settings", sub: "Preferences", href: "/settings", icon: Settings },
  { label: "Plans & Billing", sub: "Upgrade your plan", href: "/billing", icon: CreditCard },
];

type Result =
  | { kind: "page"; key: string; label: string; sub: string; href: string; icon: typeof Home }
  | { kind: "meeting"; key: string; label: string; sub: string; href: string }
  | { kind: "contact"; key: string; label: string; sub: string; href: string };

export function SearchCommand() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loaded, setLoaded] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ensureData = useCallback(() => {
    if (loaded) return;
    setLoaded(true);
    meetingsApi.getMeetings().then((r) => setMeetings(r.items)).catch(() => {});
    contactsApi.list().then((r) => setContacts(r.items)).catch(() => {});
  }, [loaded]);

  // ⌘K / Ctrl-K focuses the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        ensureData();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ensureData]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const pages = (q ? PAGES.filter((p) => p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) : PAGES)
      .map((p) => ({ kind: "page" as const, key: `page-${p.href}`, label: p.label, sub: p.sub, href: p.href, icon: p.icon }));

    const ms = (q ? meetings.filter((m) => m.title.toLowerCase().includes(q) || m.meeting_code.toLowerCase().includes(q)) : meetings.slice(0, 4))
      .slice(0, 6)
      .map((m) => ({ kind: "meeting" as const, key: `m-${m.id}`, label: m.title, sub: m.meeting_code, href: `/room/${m.meeting_code}` }));

    const cs = (q ? contacts.filter((c) => c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)) : contacts.slice(0, 4))
      .slice(0, 6)
      .map((c) => ({ kind: "contact" as const, key: `c-${c.id}`, label: c.name, sub: c.email || "Contact", href: "/contacts" }));

    return [...pages, ...ms, ...cs];
  }, [query, meetings, contacts]);

  useEffect(() => setActive(0), [query]);

  const go = (r: Result | undefined) => {
    if (!r) return;
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[active]); }
  };

  // Group results for display while keeping a flat index for keyboard nav.
  let idx = -1;
  const groups: { title: string; items: { r: Result; i: number }[] }[] = [
    { title: "Pages", items: [] },
    { title: "Meetings", items: [] },
    { title: "Contacts", items: [] },
  ];
  for (const r of results) {
    idx++;
    const g = r.kind === "page" ? 0 : r.kind === "meeting" ? 1 : 2;
    groups[g].items.push({ r, i: idx });
  }

  return (
    <div className="relative w-[300px] lg:w-[380px] hidden sm:block" ref={wrapRef}>
      <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 z-10">
        <Search className="h-[18px] w-[18px]" />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { ensureData(); setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { ensureData(); setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder="Search meetings, contacts…"
        className={cn(
          "w-full rounded-xl border pl-11 pr-16 h-10 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none transition-all font-medium",
          open ? "bg-white border-[#0E72ED]/30 ring-4 ring-[#0E72ED]/10" : "bg-[#f4f5f9] border-transparent hover:bg-gray-100",
        )}
        aria-label="Search"
        aria-expanded={open}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 tracking-wide pointer-events-none select-none shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
        ⌘K
      </span>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto rounded-2xl border border-[#ececec] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)] animate-scale-in">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
              <Search className="h-6 w-6 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">No results{query ? ` for “${query}”` : ""}</p>
              <p className="text-xs text-gray-400">Try a meeting title, code, or contact name.</p>
            </div>
          ) : (
            groups.filter((g) => g.items.length > 0).map((g) => (
              <div key={g.title} className="mb-1.5 last:mb-0">
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">{g.title}</p>
                {g.items.map(({ r, i }) => (
                  <button
                    key={r.key}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer", active === i ? "bg-[#EAF2FE]" : "hover:bg-gray-50")}
                  >
                    <ResultIcon r={r} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-800">{r.label}</span>
                      <span className="block truncate text-xs text-gray-400">{r.sub}</span>
                    </span>
                    {active === i && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ResultIcon({ r }: { r: Result }) {
  if (r.kind === "page") {
    const Icon = r.icon;
    return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0E72ED]/10 text-[#0E72ED]"><Icon className="h-[18px] w-[18px]" /></span>;
  }
  if (r.kind === "meeting") {
    return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600"><Hash className="h-[18px] w-[18px]" /></span>;
  }
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white">{getInitials(r.label) || <UserCircle2 className="h-[18px] w-[18px]" />}</span>;
}
