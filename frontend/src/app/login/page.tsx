"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setToken } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";
import { Spinner } from "@/components/ui/Spinner";
import { AuthShell, SocialSignIn } from "@/components/auth/AuthChrome";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stay, setStay] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
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

  const demoNote = () => setNotice("Single sign-on and social login aren’t enabled in this demo — sign in with the email and password above.");

  const field = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF]/20";

  return (
    <AuthShell
      headerCta={
        <span>
          New to Zoom?{" "}
          <Link href="/signup" className="font-semibold text-[#0B5CFF] hover:underline">Sign Up Free</Link>
        </span>
      }
    >
      <h1 className="mb-6 text-[28px] font-bold leading-tight text-gray-900">Sign In</h1>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">Email Address</label>
          <input id="email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className={field} required />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-semibold text-gray-700">Password</label>
            <button type="button" onClick={() => setNotice("Password reset isn’t available in this demo. Use demo@zoom.clone / demo1234.")} className="text-[13px] font-semibold text-[#0B5CFF] hover:underline cursor-pointer">Forgot?</button>
          </div>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={field} required />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 select-none">
          <input type="checkbox" checked={stay} onChange={(e) => setStay(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#0B5CFF] accent-[#0B5CFF]" />
          Stay signed in
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {notice && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-[#0B5CFF]">{notice}</p>}

        <button type="submit" disabled={busy} className="mt-1 inline-flex h-11 items-center justify-center rounded-lg bg-[#0B5CFF] text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a4fdb] disabled:opacity-60 cursor-pointer">
          {busy ? <Spinner size="sm" className="text-white" /> : "Sign In"}
        </button>
      </form>

      <SocialSignIn verb="sign in" onUnavailable={demoNote} />

      <p className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-xs text-gray-500">
        Demo account — <span className="font-semibold text-gray-700">demo@zoom.clone</span> · <span className="font-semibold text-gray-700">demo1234</span>
      </p>
    </AuthShell>
  );
}
