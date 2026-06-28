export type ParticipantRole = "host" | "cohost" | "attendee";

export interface Participant {
  id: string;
  meeting_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  is_video_off: boolean;
  is_screen_sharing: boolean;
}

/** Participant augmented with user profile data — used in room UI. */
export interface ParticipantWithUser extends Participant {
  display_name: string;
  avatar_url: string | null;
}
