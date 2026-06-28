"use client";

import * as React from "react";
import { cn, getInitials } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const sizeStyles: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

// ── Component ──────────────────────────────────────────────────────────────

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showFallback = !src || imgError;
  const initials = getInitials(name);

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        "rounded-full overflow-hidden shrink-0 select-none",
        "bg-gradient-to-br from-blue-600 to-violet-600",
        sizeStyles[size],
        className,
      )}
      aria-label={name}
      title={name}
    >
      {!showFallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
      {showFallback && (
        <span className="font-semibold text-white leading-none">
          {initials}
        </span>
      )}
    </span>
  );
}
