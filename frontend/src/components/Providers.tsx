"use client";

import { useEffect } from "react";
import { usersApi } from "@/lib/api/users";
import { useUserStore } from "@/store/userStore";

/**
 * Client-side provider that bootstraps application state on mount.
 *
 * Responsibilities:
 * - Fetches the default user from the API and hydrates the Zustand userStore.
 *
 * Kept as a thin wrapper so future providers (theme, toast, etc.)
 * can be composed here without touching any page or layout file.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    usersApi
      .getMe()
      .then(setUser)
      .catch((err) => {
        // In development, log the error so it's visible in the console.
        // The app continues to function; routes that need the user show
        // a graceful empty state rather than crashing.
        console.error("[Providers] Failed to load user profile:", err);
      });
  }, [setUser]);

  return <>{children}</>;
}
