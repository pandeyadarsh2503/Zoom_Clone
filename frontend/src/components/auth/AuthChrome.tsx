"use client";

/**
 * Shared chrome for the sign-in / sign-up pages, styled to match Zoom's
 * web sign-in (zoom.us/signin): slim top bar with the wordmark, a centered
 * narrow form column, the "Or sign in with" social row (SSO/Apple/Google/
 * Facebook), and a legal footer.
 *
 * The social/SSO buttons are visual-only — this build authenticates with
 * email + password — so they surface a friendly note instead.
 */

import Link from "next/link";
import { KeyRound } from "lucide-react";

export function ZoomWordmark({ className = "" }: { className?: string }) {
  return <span className={`text-2xl font-bold lowercase tracking-tight text-[#0B5CFF] select-none ${className}`}>zoom</span>;
}

// ── Brand glyphs ─────────────────────────────────────────────────────────────
function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000" aria-hidden>
      <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.93-.03-.01-2.7-1.04-2.73-4.13zM14.6 4.59c.71-.86 1.19-2.05 1.06-3.24-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.97-1.08 3.13 1.14.09 2.3-.58 3.01-1.43z" />
    </svg>
  );
}
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const PROVIDERS = [
  { key: "sso", label: "SSO", glyph: <KeyRound className="h-5 w-5 text-[#0B5CFF]" /> },
  { key: "apple", label: "Apple", glyph: <AppleGlyph /> },
  { key: "google", label: "Google", glyph: <GoogleGlyph /> },
  { key: "facebook", label: "Facebook", glyph: <FacebookGlyph /> },
];

export function SocialSignIn({ verb, onUnavailable }: { verb: string; onUnavailable: () => void }) {
  return (
    <div>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">Or {verb} with</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {PROVIDERS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={onUnavailable}
            className="flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 transition hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
            aria-label={`${verb} with ${p.label}`}
          >
            {p.glyph}
            <span className="text-[11px] font-medium text-gray-500">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AuthShell({ children, headerCta }: { children: React.ReactNode; headerCta: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5 sm:px-8">
        <Link href="/login" aria-label="Zoom">
          <ZoomWordmark />
        </Link>
        <div className="text-sm text-gray-600">{headerCta}</div>
      </header>

      {/* Centered form column */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>

      {/* Legal footer */}
      <footer className="shrink-0 border-t border-gray-100 px-5 py-5 sm:px-8">
        <p className="text-center text-xs text-gray-400">
          © 2026 Zoom Clone, a demo project.{" "}
          <span className="mx-1 hidden sm:inline">|</span>
          <br className="sm:hidden" />
          <span className="cursor-default hover:text-gray-600">Privacy &amp; Legal Policies</span>
          <span className="mx-2">·</span>
          <span className="cursor-default hover:text-gray-600">Acceptable Use Guidelines</span>
          <span className="mx-2">·</span>
          <span className="cursor-default hover:text-gray-600">Cookie Preferences</span>
        </p>
      </footer>
    </div>
  );
}
