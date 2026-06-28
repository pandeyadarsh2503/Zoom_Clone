import { apiClient } from "./client";
import type { User, UserUpdate } from "@/types/user";

/**
 * User-domain API calls.
 *
 * Thin wrappers around apiClient — each function maps 1-to-1 with a backend
 * endpoint so callers import from here rather than constructing paths manually.
 */
export const usersApi = {
  /** GET /api/v1/users/me — returns the profile of the default user. */
  getMe(): Promise<User> {
    return apiClient.get<User>("/api/v1/users/me");
  },

  /** PATCH /api/v1/users/me — updates display_name and/or avatar_url. */
  updateMe(data: UserUpdate): Promise<User> {
    return apiClient.patch<User>("/api/v1/users/me", data);
  },
};
