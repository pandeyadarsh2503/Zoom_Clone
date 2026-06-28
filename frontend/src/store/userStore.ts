import { create } from "zustand";
import type { User } from "@/types/user";
import { clearToken } from "@/lib/auth";

interface UserState {
  /** The authenticated user, or null when signed out. */
  user: User | null;
  /** True once the initial auth check has completed (token validated or absent). */
  isLoaded: boolean;
  /** Store the fetched/authenticated user. */
  setUser: (user: User) => void;
  /** Mark the auth check complete with no user (signed out). */
  clearUser: () => void;
  /** Sign out — drops the token and the user, then marks loaded. */
  logout: () => void;
}

/**
 * Global auth/user store. Hydrated in Providers via GET /auth/me using the
 * stored bearer token. `isLoaded` lets route guards wait for the check.
 */
export const useUserStore = create<UserState>()((set) => ({
  user: null,
  isLoaded: false,
  setUser: (user) => set({ user, isLoaded: true }),
  clearUser: () => set({ user: null, isLoaded: true }),
  logout: () => {
    clearToken();
    set({ user: null, isLoaded: true });
  },
}));
