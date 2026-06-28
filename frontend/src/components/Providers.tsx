"use client";

import { useEffect } from "react";
import { usersApi } from "@/lib/api/users";
import { useUserStore } from "@/store/userStore";
import { getToken, clearToken } from "@/lib/auth";

/**
 * Bootstraps auth state on mount: if a bearer token is present, fetch the
 * profile (GET /users/me) and hydrate the store; if it's missing or rejected,
 * mark the user signed-out so route guards can redirect to /login.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    if (!getToken()) {
      clearUser();
      return;
    }
    usersApi
      .getMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        clearUser();
      });
  }, [setUser, clearUser]);

  return <>{children}</>;
}
