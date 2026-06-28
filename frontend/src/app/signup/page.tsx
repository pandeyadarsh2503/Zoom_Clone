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

export default function SignupPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await authApi.register({ email: email.trim(), password, display_name: name.trim() });
      setToken(res.access_token);
      setUser(res.user);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Couldn’t create your account. Try again.");
      setBusy(false);
    }
  };

  const demoNote = () => setNotice("Single sign-on and social sign-up aren’t enabled in this demo — create an account with your email above.");

  const field = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:border-[#0B5CFF] focus:ring-2 focus:ring-[#0B5CFF]/20";

  return (
    <AuthShell
      headerCta={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0B5CFF] hover:underline">Sign In</Link>
        </span>
      }
    >
      <h1 className="text-[28px] font-bold leading-tight text-gray-900">Sign Up Free</h1>
      <p className="mb-6 mt-1 text-sm text-gray-500">Free forever for personal meetings.</p>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[13px] font-semibold text-gray-700">Full Name</label>
          <input id="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className={field} required />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">Email Address</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className={field} required />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-gray-700">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" className={field} required />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {notice && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-[#0B5CFF]">{notice}</p>}

        <p className="text-xs leading-relaxed text-gray-400">
          By signing up, I agree to the Privacy Policy and Terms of Service.
        </p>

        <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0B5CFF] text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a4fdb] disabled:opacity-60 cursor-pointer">
          {busy ? <Spinner size="sm" className="text-white" /> : "Sign Up Free"}
        </button>
      </form>

      <SocialSignIn verb="sign up" onUnavailable={demoNote} />
    </AuthShell>
  );
}
