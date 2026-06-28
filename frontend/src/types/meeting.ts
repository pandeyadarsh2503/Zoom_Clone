export type MeetingStatus = "scheduled" | "live" | "ended" | "cancelled";

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
  created_at: string;
  updated_at: string;
}

export interface MeetingCreate {
  title: string;
  description?: string;
  scheduled_at?: string;
  max_participants?: number;
}

export interface MeetingUpdate {
  title?: string;
  description?: string;
  scheduled_at?: string;
  max_participants?: number;
}
