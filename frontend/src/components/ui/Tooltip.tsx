"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}

// ── Placement styles ───────────────────────────────────────────────────────

const placementStyles = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

// ── Component ──────────────────────────────────────────────────────────────

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap",
            "rounded-lg border border-white/10 bg-[#1a1a24] px-2.5 py-1.5",
            "text-xs font-medium text-slate-200 shadow-xl",
            "animate-fade-in",
            placementStyles[side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
