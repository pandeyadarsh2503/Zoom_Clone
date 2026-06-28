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
