import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "live";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-slate-300 border-white/10",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/15 text-red-400 border-red-500/20",
  live: "bg-red-500/20 text-red-400 border-red-500/30",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  live: "bg-red-400 animate-pulse",
};

// ── Component ──────────────────────────────────────────────────────────────

export function Badge({ label, variant = "default", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5",
        "rounded-full border text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotStyles[variant])} />
      )}
      {label}
    </span>
  );
}
