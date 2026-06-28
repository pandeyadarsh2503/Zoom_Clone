"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

// ── Types ──────────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-sm shadow-blue-900/30",
  secondary:
    "bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10 hover:border-white/20",
  ghost:
    "text-slate-400 hover:text-white hover:bg-white/5",
  destructive:
    "bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-sm shadow-red-900/30",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-base gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

// ── Component ──────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-medium",
          "transition-colors duration-150 select-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[#0d0d12]",
          // States
          "disabled:opacity-50 disabled:pointer-events-none",
          // Variant + size
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
