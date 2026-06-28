import { create } from "zustand";
import type { User } from "@/types/user";

interface UserState {
  /** The seeded default user, or null before the first fetch completes. */
  user: User | null;
  /** True once the first successful API call has returned. */
  isLoaded: boolean;
  /** Store the fetched user. */
  setUser: (user: User) => void;
  /** Reset — used when user data needs to be invalidated. */
  clearUser: () => void;
}

/**
 * Global user store.
 *
 * Hydrated in Providers.tsx on mount via GET /api/v1/users/me.
 * No auth logic — the store simply holds the resolved user object so that
 * every component can read it without re-fetching.
 */
export const useUserStore = create<UserState>()((set) => ({
  user: null,
  isLoaded: false,
  setUser: (user) => set({ user, isLoaded: true }),
  clearUser: () => set({ user: null, isLoaded: false }),
}));
