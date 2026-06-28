"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ── Component ──────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-500 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              "w-full rounded-lg border bg-white/5 text-slate-100",
              "text-sm placeholder:text-slate-600",
              "transition-colors duration-150",
              // Focus
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              // Padding
              leftIcon ? "pl-9" : "pl-3",
              rightIcon ? "pr-9" : "pr-3",
              "py-2.5",
              // Error / normal border
              error
                ? "border-red-500/60 focus:ring-red-500"
                : "border-white/10 hover:border-white/20",
              // Disabled
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className,
            )}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            aria-invalid={!!error}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-slate-500 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
