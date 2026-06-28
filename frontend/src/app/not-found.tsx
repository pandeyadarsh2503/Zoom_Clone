import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6">
      <div className="surface-card w-full max-w-md p-8 text-center animate-fade-in">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F2FF] text-[#0E72ED]">
          <Compass className="h-7 w-7" />
        </span>
        <p className="text-sm font-bold uppercase tracking-wider text-gray-400">404</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#0E72ED] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0966d9] hover:shadow-md"
        >
          <Home className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
