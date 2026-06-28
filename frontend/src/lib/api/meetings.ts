import { apiClient } from "./client";
import type { Meeting, MeetingStatus } from "@/types/meeting";

export interface MeetingsResponse {
  items: Meeting[];
  total: number;
}

/**
 * Meeting-domain API calls.
 */
export const meetingsApi = {
  /** GET /api/v1/meetings — returns the current user's meetings list, with optional status filter. */
  getMeetings(status?: MeetingStatus): Promise<MeetingsResponse> {
    const query = status ? `?status=${status}` : "";
    return apiClient.get<MeetingsResponse>(`/api/v1/meetings${query}`);
  },
};
