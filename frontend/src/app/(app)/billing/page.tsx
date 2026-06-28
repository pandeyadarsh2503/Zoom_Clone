"use client";

/**
 * Billing / Plans — mock UI.
 *
 * Shows the account's current plan and the upgrade options. This build has no
 * payment processor, so "Upgrade" is a placeholder (no real charge is made).
 */

import { useState } from "react";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    key: "free",
    name: "Basic",
    price: "$0",
    cadence: "forever",
    icon: <Sparkles className="h-5 w-5" />,
    features: ["Unlimited 1:1 meetings", "40-min group meetings", "Up to 100 participants", "In-meeting chat & reactions"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$13.33",
    cadence: "/mo per user",
    icon: <Zap className="h-5 w-5" />,
    highlight: true,
    features: ["30-hour group meetings", "Cloud recording (5 GB)", "Whiteboard & breakout rooms", "Live captions & polls"],
  },
  {
    key: "business",
    name: "Business",
    price: "$18.33",
    cadence: "/mo per user",
    icon: <Building2 className="h-5 w-5" />,
    features: ["Up to 300 participants", "Unlimited cloud recording", "Admin dashboard & SSO", "Managed domains"],
  },
];

export default function BillingPage() {
  const user = useUserStore((s) => s.user);
  const current = user?.plan ?? "free";
  const [toast, setToast] = useState<string | null>(null);

  const upgrade = (name: string) => {
    setToast(`Upgrading to ${name} — payments aren’t enabled in this build.`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 pt-8 pb-16 lg:px-8 md:pb-8">
      <div className="mb-2 text-center sm:text-left">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Plans &amp; Billing</h1>
        <p className="mt-1.5 text-base text-gray-500">
          You’re on the <span className="font-semibold capitalize text-gray-700">{current === "free" ? "Basic" : current}</span> plan. Upgrade for more.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.key === current;
          return (
            <div key={p.key} className={cn("surface-card relative flex flex-col p-6", p.highlight && "ring-2 ring-[#0E72ED]")}>
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0E72ED] px-3 py-1 text-xs font-bold text-white">Most popular</span>
              )}
              <div className="flex items-center gap-2.5">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", p.highlight ? "bg-[#0E72ED] text-white" : "bg-[#0E72ED]/10 text-[#0E72ED]")}>{p.icon}</span>
                <h2 className="text-lg font-bold text-gray-900">{p.name}</h2>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">{p.price}</span>
                <span className="text-sm text-gray-400">{p.cadence}</span>
              </div>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && upgrade(p.name)}
                disabled={isCurrent}
                className={cn(
                  "mt-6 inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold transition cursor-pointer",
                  isCurrent
                    ? "cursor-default bg-gray-100 text-gray-400"
                    : p.highlight
                      ? "bg-[#0E72ED] text-white hover:bg-[#0966d9] shadow-sm"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50",
                )}
              >
                {isCurrent ? "Current plan" : `Upgrade to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">Prices shown are illustrative. No payment is processed in this build.</p>

      {toast && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
          <div className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">{toast}</div>
        </div>
      )}
    </div>
  );
}
