import { apiClient } from "./client";
import type { Meeting, MeetingStatus } from "@/types/meeting";

export interface MeetingsResponse {
  items: Meeting[];
  total: number;
}

/** Response from POST /api/v1/meetings/instant — a meeting plus its share link. */
export interface InstantMeetingResponse extends Meeting {
  invite_url: string;
}

/** Body for POST /api/v1/meetings/join. */
export interface JoinMeetingPayload {
  meeting_code: string;
  display_name: string;
}

/** Response from POST /api/v1/meetings/join — the joined meeting plus its share link. */
export interface JoinMeetingResponse extends Meeting {
  invite_url: string;
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

  /** POST /api/v1/meetings/instant — start a live instant meeting and get its invite URL. */
  createInstantMeeting(): Promise<InstantMeetingResponse> {
    return apiClient.post<InstantMeetingResponse>("/api/v1/meetings/instant");
  },

  /** POST /api/v1/meetings/join — join an existing meeting by code or invite link. */
  joinMeeting(payload: JoinMeetingPayload): Promise<JoinMeetingResponse> {
    return apiClient.post<JoinMeetingResponse>("/api/v1/meetings/join", payload);
  },
};
