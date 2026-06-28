export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";

export type Recurrence = "daily" | "weekly" | "monthly";

export interface Meeting {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  meeting_code: string;
  status: MeetingStatus;
  scheduled_at: string | null; // ISO-8601
  started_at: string | null;
  ended_at: string | null;
  max_participants: number;
  duration_minutes: number;
  passcode: string | null;
  waiting_room: boolean;
  recurrence: Recurrence | null;
  invitees: string | null; // comma-separated emails
  host_video: boolean;
  participant_video: boolean;
  join_before_host: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledMeetingCreate {
  title: string;
  description?: string;
  scheduled_at: string; // ISO-8601 (local)
  duration_minutes: number;
  passcode?: string;
  waiting_room?: boolean;
  recurrence?: Recurrence | null;
  invitees?: string[];
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
}

export interface MeetingUpdate {
  title?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  passcode?: string;
  waiting_room?: boolean;
  recurrence?: Recurrence | null;
  invitees?: string[];
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
}
