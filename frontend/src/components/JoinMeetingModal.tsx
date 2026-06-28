"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Link as LinkIcon, User as UserIcon, AlertCircle, ArrowRight } from "lucide-react";
import { meetingsApi } from "@/lib/api/meetings";
import { ApiError } from "@/lib/api/client";
import { useUserStore } from "@/store/userStore";
import { cn, parseMeetingCode } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

interface JoinMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FieldErrors {
  identifier?: string;
  name?: string;
}

/**
 * Join-meeting dialog.
 *
 * Collects a meeting ID (or invite link) and a display name, validates both
 * client-side, then asks the backend to validate and record the join before
 * redirecting into the room. Backend errors (unknown / ended / full meeting)
 * are surfaced inline.
 */
export function JoinMeetingModal({ isOpen, onClose }: JoinMeetingModalProps) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Reset + prefill on open; autofocus the first field.
  useEffect(() => {
    if (!isOpen) return;
    setIdentifier("");
    setName(user?.display_name ?? "");
    setErrors({});
    setGeneralError(null);
    setIsJoining(false);
    const t = setTimeout(() => firstInputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen, user?.display_name]);

  // Escape to close + lock body scroll.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isJoining) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, isJoining, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!parseMeetingCode(identifier)) {
      next.identifier = "Enter a meeting ID or invite link.";
    }
    if (!name.trim()) {
      next.name = "Please enter your name.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return; // prevent duplicate submits
    setGeneralError(null);
    if (!validate()) return;

    setIsJoining(true);
    try {
      const result = await meetingsApi.joinMeeting({
        meeting_code: parseMeetingCode(identifier),
        display_name: name.trim(),
      });
      // Reflect the chosen display name across the app.
      if (user) setUser({ ...user, display_name: name.trim() });
      router.push(`/room/${result.meeting_code}`);
      // Stay busy — we are navigating away.
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
      if (err instanceof ApiError) {
        message =
          err.code === "NOT_FOUND"
            ? "We couldn’t find that meeting. Check the ID or link and try again."
            : err.message || message;
      }
      setGeneralError(message);
      setIsJoining(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "h-11 w-full rounded-xl border bg-white pl-11 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all",
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
        : "border-gray-200 focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10",
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal aria-labelledby="join-title">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => !isJoining && onClose()}
        aria-hidden
      />

      {/* Panel */}
      <div className="surface-card relative z-10 w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2D8CFF] to-[#0E72ED] text-white shadow-md">
              <ArrowRight className="h-5 w-5" />
            </span>
            <div>
              <h2 id="join-title" className="text-lg font-bold text-gray-900 leading-tight">
                Join a meeting
              </h2>
              <p className="mt-1 text-sm text-gray-500 leading-tight">
                Enter a meeting ID or paste an invite link.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isJoining}
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 outline-none cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-6 pb-6">
          {/* Meeting ID / link */}
          <div>
            <label htmlFor="join-id" className="mb-2 block text-sm font-semibold text-gray-700">
              Meeting ID or invite link
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                <LinkIcon className="h-[18px] w-[18px]" />
              </span>
              <input
                id="join-id"
                ref={firstInputRef}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier) setErrors((p) => ({ ...p, identifier: undefined }));
                }}
                placeholder="abc-defg-hij  or  https://…/room/abc-defg-hij"
                aria-invalid={!!errors.identifier}
                className={inputClass(!!errors.identifier)}
              />
            </div>
            {errors.identifier && (
              <p className="mt-1.5 text-sm font-medium text-red-600">{errors.identifier}</p>
            )}
          </div>

          {/* Display name */}
          <div>
            <label htmlFor="join-name" className="mb-2 block text-sm font-semibold text-gray-700">
              Your name
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                <UserIcon className="h-[18px] w-[18px]" />
              </span>
              <input
                id="join-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="e.g. Adarsh Pandey"
                maxLength={100}
                aria-invalid={!!errors.name}
                className={inputClass(!!errors.name)}
              />
            </div>
            {errors.name && <p className="mt-1.5 text-sm font-medium text-red-600">{errors.name}</p>}
          </div>

          {/* Backend error */}
          {generalError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-red-700">{generalError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isJoining}
              className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 outline-none cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isJoining}
              aria-busy={isJoining}
              className="inline-flex h-10 min-w-[110px] items-center justify-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0966d9] hover:shadow-md disabled:cursor-wait disabled:opacity-90 cursor-pointer"
            >
              {isJoining ? (
                <>
                  <Spinner size="sm" className="text-white" /> Joining…
                </>
              ) : (
                "Join Meeting"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
