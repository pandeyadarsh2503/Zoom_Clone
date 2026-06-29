"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Timer,
  Type,
  AlignLeft,
  Link as LinkIcon,
  Check,
  Copy,
  AlertCircle,
  CalendarCheck,
  Repeat,
  Users,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { meetingsApi } from "@/lib/api/meetings";
import { ApiError } from "@/lib/api/client";
import { cn, formatRelativeDay, formatTime } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";

const DURATIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hour 30 minutes" },
  { value: 120, label: "2 hours" },
];

interface FieldErrors {
  title?: string;
  date?: string;
  time?: string;
}

function OptionToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer outline-none", checked ? "bg-[#0E72ED]" : "bg-gray-300")}
      >
        <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

function ScheduleForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const isEdit = !!editId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);

  // Meeting options
  const [recurrence, setRecurrence] = useState<"" | "daily" | "weekly" | "monthly">("");
  const [invitees, setInvitees] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(true);
  const [joinBeforeHost, setJoinBeforeHost] = useState(true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [existingLink, setExistingLink] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load the meeting when editing.
  useEffect(() => {
    if (!editId) return;
    let active = true;
    (async () => {
      try {
        const m = await meetingsApi.getMeeting(editId);
        if (!active) return;
        setTitle(m.title);
        setDescription(m.description ?? "");
        if (m.scheduled_at) {
          // Stored as UTC — show it back in the user's local date/time.
          const d = new Date(m.scheduled_at);
          const pad = (n: number) => String(n).padStart(2, "0");
          setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
          setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
        setDuration(m.duration_minutes ?? 30);
        setRecurrence((m.recurrence as "" | "daily" | "weekly" | "monthly") ?? "");
        setInvitees(m.invitees ?? "");
        setRequirePasscode(!!m.passcode);
        setPasscode(m.passcode ?? "");
        setWaitingRoom(!!m.waiting_room);
        setHostVideo(m.host_video ?? true);
        setParticipantVideo(m.participant_video ?? true);
        setJoinBeforeHost(m.join_before_host ?? true);
        setExistingLink(m.invite_url);
      } catch (err: unknown) {
        if (active) setLoadError(err instanceof Error ? err.message : "Couldn’t load this meeting.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [editId]);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const validate = (): { ok: boolean; scheduledAt?: string } => {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = "Give your meeting a title.";
    if (!date) next.date = "Pick a date.";
    if (!time) next.time = "Pick a time.";

    let scheduledAt: string | undefined;
    if (date && time) {
      // The picker gives local date+time. Convert to a UTC instant (ISO with Z)
      // so it round-trips correctly regardless of the server's timezone.
      const local = new Date(`${date}T${time}:00`);
      scheduledAt = local.toISOString();
      if (local.getTime() <= Date.now()) {
        next.time = "Choose a time in the future.";
      }
    }
    setErrors(next);
    return { ok: Object.keys(next).length === 0, scheduledAt };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setGeneralError(null);
    const { ok, scheduledAt } = validate();
    if (!ok || !scheduledAt) return;

    const inviteeList = invitees.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    const options = {
      recurrence: recurrence || null,
      invitees: inviteeList,
      passcode: requirePasscode ? passcode.trim() : "",
      waiting_room: waitingRoom,
      host_video: hostVideo,
      participant_video: participantVideo,
      join_before_host: joinBeforeHost,
    } as const;

    setIsSaving(true);
    try {
      if (isEdit && editId) {
        await meetingsApi.updateMeeting(editId, {
          title: title.trim(),
          description: description.trim(),
          scheduled_at: scheduledAt,
          duration_minutes: duration,
          ...options,
        });
        router.push("/");
      } else {
        const created = await meetingsApi.createScheduled({
          title: title.trim(),
          description: description.trim() || undefined,
          scheduled_at: scheduledAt,
          duration_minutes: duration,
          ...options,
        });
        setCreatedLink(created.invite_url);
      }
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
      if (err instanceof ApiError) message = err.message || message;
      setGeneralError(message);
      setIsSaving(false);
    }
  };

  const inputBase =
    "h-11 w-full rounded-xl border bg-white text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all";
  const inputState = (hasError: boolean) =>
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-gray-200 focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10";

  const prettyWhen = useMemo(() => {
    if (!date || !time) return null;
    const iso = `${date}T${time}:00`;
    return `${formatRelativeDay(iso)} · ${formatTime(iso)}`;
  }, [date, time]);

  // ── Success state (after creating) ──────────────────────────────
  if (createdLink) {
    return (
      <div className="mx-auto w-full max-w-160 px-6 py-8 lg:px-8">
        <div className="surface-card p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5EC] text-[#16A34A]">
            <CalendarCheck className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Meeting scheduled</h1>
          <p className="mt-2 text-sm text-gray-500">
            “{title.trim()}” is set for {prettyWhen}.
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#ececec] bg-[#F8FAFC] p-3 text-left">
            <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-600">{createdLink}</span>
            <button
              onClick={() => copyLink(createdLink)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#0E72ED] ring-1 ring-gray-200 transition hover:bg-gray-50 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCreatedLink(null);
                setTitle("");
                setDescription("");
                setDate("");
                setTime("");
                setDuration(30);
                setIsSaving(false);
              }}
              className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer"
            >
              Schedule another
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0966d9] hover:shadow-md"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-160 px-6 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {isEdit ? "Edit meeting" : "Schedule a meeting"}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? "Update the details below." : "Plan a meeting and share the link."}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="surface-card flex flex-col gap-6 p-6 sm:p-8" aria-busy="true" aria-label="Loading meeting">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      ) : loadError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-base font-semibold text-red-800">Couldn’t load meeting</p>
            <p className="mt-1 text-sm text-red-600">{loadError}</p>
            <Link href="/" className="mt-3 inline-block text-sm font-semibold text-[#0E72ED]">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="surface-card flex flex-col gap-6 p-6 sm:p-8">
          {/* Title */}
          <div>
            <label htmlFor="m-title" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Type className="h-4 w-4 text-gray-400" /> Title
            </label>
            <input
              id="m-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="e.g. Q3 Planning Sync"
              maxLength={200}
              className={cn(inputBase, "px-3.5", inputState(!!errors.title))}
            />
            {errors.title && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="m-desc" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <AlignLeft className="h-4 w-4 text-gray-400" /> Description <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="m-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this meeting about?"
              rows={3}
              maxLength={4000}
              className={cn(
                "w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10",
              )}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="m-date" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" /> Date
              </label>
              <input
                id="m-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                }}
                className={cn(inputBase, "px-3.5", inputState(!!errors.date))}
              />
              {errors.date && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.date}</p>}
            </div>
            <div>
              <label htmlFor="m-time" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="h-4 w-4 text-gray-400" /> Time
              </label>
              <input
                id="m-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (errors.time) setErrors((p) => ({ ...p, time: undefined }));
                }}
                className={cn(inputBase, "px-3.5", inputState(!!errors.time))}
              />
              {errors.time && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.time}</p>}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="m-duration" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Timer className="h-4 w-4 text-gray-400" /> Duration
            </label>
            <select
              id="m-duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={cn(inputBase, "cursor-pointer px-3", inputState(false))}
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recurrence + Invitees */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="m-recur" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Repeat className="h-4 w-4 text-gray-400" /> Repeat
              </label>
              <select
                id="m-recur"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as "" | "daily" | "weekly" | "monthly")}
                className={cn(inputBase, "cursor-pointer px-3", inputState(false))}
              >
                <option value="">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label htmlFor="m-invitees" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users className="h-4 w-4 text-gray-400" /> Invite <span className="font-normal text-gray-400">(emails)</span>
              </label>
              <input
                id="m-invitees"
                value={invitees}
                onChange={(e) => setInvitees(e.target.value)}
                placeholder="alex@acme.io, sam@acme.io"
                className={cn(inputBase, "px-3.5")}
              />
            </div>
          </div>

          {/* Options */}
          <div className="rounded-2xl border border-[#ececec] bg-[#FAFBFC] p-4 sm:p-5">
            <p className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700">
              <ShieldCheck className="h-4 w-4 text-gray-400" /> Meeting options
            </p>
            <div className="divide-y divide-gray-100">
              <div className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800"><KeyRound className="h-3.5 w-3.5 text-gray-400" /> Require passcode</p>
                    <p className="text-sm text-gray-500">Participants must enter a passcode to join.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={requirePasscode}
                    aria-label="Require passcode"
                    onClick={() => setRequirePasscode((v) => !v)}
                    className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer outline-none", requirePasscode ? "bg-[#0E72ED]" : "bg-gray-300")}
                  >
                    <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform", requirePasscode ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                </div>
                {requirePasscode && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.slice(0, 10))}
                      placeholder="e.g. 4821"
                      maxLength={10}
                      className="h-10 w-40 rounded-lg border border-gray-200 bg-white px-3 text-sm font-mono tracking-widest text-gray-800 outline-none focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setPasscode(String(Math.floor(1000 + Math.random() * 9000)))}
                      className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                )}
              </div>
              <OptionToggle label="Waiting room" desc="Hold joiners until you admit them." checked={waitingRoom} onChange={() => setWaitingRoom((v) => !v)} />
              <OptionToggle label="Host video on" desc="Start your camera when the meeting begins." checked={hostVideo} onChange={() => setHostVideo((v) => !v)} />
              <OptionToggle label="Participant video on" desc="Start participant cameras on join." checked={participantVideo} onChange={() => setParticipantVideo((v) => !v)} />
              <OptionToggle label="Allow join before host" desc="Let people enter before you arrive." checked={joinBeforeHost} onChange={() => setJoinBeforeHost((v) => !v)} />
            </div>
          </div>

          {/* Existing link (edit mode) */}
          {isEdit && existingLink && (
            <div className="flex items-center gap-2 rounded-xl border border-[#ececec] bg-[#F8FAFC] p-3">
              <LinkIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-600">{existingLink}</span>
              <button
                type="button"
                onClick={() => copyLink(existingLink)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-[#0E72ED] ring-1 ring-gray-200 transition hover:bg-gray-50 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {/* Backend error */}
          {generalError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{generalError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-400">
              {prettyWhen ? <>Starts <span className="font-semibold text-gray-600">{prettyWhen}</span></> : "A join link is generated automatically."}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                disabled={isSaving}
                className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-10 min-w-35 items-center justify-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0966d9] hover:shadow-md disabled:cursor-wait disabled:opacity-90 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="text-white" /> Saving…
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Schedule meeting"
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleForm />
    </Suspense>
  );
}
