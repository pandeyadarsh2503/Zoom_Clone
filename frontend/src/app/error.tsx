"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * Route-segment error boundary. Catches render/runtime errors anywhere below
 * the root layout and offers a recovery path instead of a white screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6">
      <div className="surface-card w-full max-w-md p-8 text-center animate-fade-in">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          An unexpected error occurred. You can try again, or head back to your dashboard.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-gray-400">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0966d9] hover:shadow-md cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
