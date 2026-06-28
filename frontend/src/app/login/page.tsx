"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setToken } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.login(email.trim(), password);
      setToken(res.access_token);
      setUser(res.user);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Couldn’t sign in. Try again.");
      setBusy(false);
    }
  };

  const field = "h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0E72ED] focus:ring-4 focus:ring-[#0E72ED]/10";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 text-center">
          <span className="text-3xl font-bold lowercase tracking-tight text-[#0E72ED]">zoom</span>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account.</p>
        </div>

        <form onSubmit={submit} className="surface-card flex flex-col gap-4 p-6">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
            <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} required />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={field} required />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={busy} className={cn("inline-flex h-11 items-center justify-center rounded-lg bg-[#0E72ED] text-sm font-semibold text-white shadow-sm transition hover:bg-[#0966d9] disabled:opacity-60 cursor-pointer")}>
            {busy ? <Spinner size="sm" className="text-white" /> : "Sign in"}
          </button>

          <p className="rounded-lg bg-[#F0F6FF] px-3 py-2 text-center text-xs text-gray-500">
            Demo account — <span className="font-semibold text-gray-700">demo@zoom.clone</span> / <span className="font-semibold text-gray-700">demo1234</span>
          </p>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          New here? <Link href="/signup" className="font-semibold text-[#0E72ED] hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
