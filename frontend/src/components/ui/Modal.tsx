"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Width variant. Defaults to "md". */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

// ── Close icon ─────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full animate-fade-in",
          "rounded-2xl border border-white/10 bg-[#14141c] shadow-2xl",
          sizeStyles[size],
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-slate-100">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-400">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
