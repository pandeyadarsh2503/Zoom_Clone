import { cn } from "@/lib/utils";

/**
 * Skeleton — a shimmering placeholder block used while content loads.
 * Decorative only, so it is hidden from assistive tech.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}
