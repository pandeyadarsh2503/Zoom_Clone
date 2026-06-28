/**
 * Utility helpers shared across the application.
 */

/**
 * Merges class names, filtering out falsy values.
 *
 * Usage:
 *   cn("base-class", isActive && "active", variant === "primary" && "text-blue-500")
 */
export function cn(
  ...inputs: Array<string | undefined | null | false | 0>
): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Formats an ISO-8601 date string into a localised, human-readable form.
 *
 * Example output: "Jun 28, 2026 at 4:30 PM"
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/**
 * Formats an ISO-8601 timestamp into a bare clock time.
 *
 * Example output: "4:30 PM"
 */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/**
 * Returns a human-friendly day label relative to today.
 *
 * "Today" · "Tomorrow" · "Yesterday" · otherwise "Jun 26, 2026".
 */
export function formatRelativeDay(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(target) - startOfDay(now)) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(target);
}

/**
 * Returns the duration between two ISO timestamps as "1h 10m" / "45m".
 */
export function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.max(
    0,
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000),
  );
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * True when an ISO timestamp falls on the current calendar day.
 */
export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Returns the uppercase initials of a display name.
 *
 * "Alice Johnson" → "AJ"
 * "Bob"           → "B"
 */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

/**
 * Generates a random short code suitable for a meeting join link.
 * Format: "xxx-yyyy-zzz" (10 chars + 2 dashes = 12).
 */
export function generateMeetingCode(): string {
  const segment = () =>
    Math.random().toString(36).substring(2, 5).padEnd(3, "0");
  return `${segment()}-${segment()}${segment()}-${segment()}`;
}
