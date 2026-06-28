"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Gate that only renders its children for an authenticated user. While the
 * initial auth check is in flight it shows a spinner; once resolved with no
 * user it redirects to /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const isLoaded = useUserStore((s) => s.isLoaded);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) router.replace("/login");
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F8FA]">
        <Spinner size="lg" className="text-[#0E72ED]" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
