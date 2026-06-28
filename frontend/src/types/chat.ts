export type MessageType = "text" | "file" | "system";

export interface ChatMessage {
  id: string;
  meeting_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: MessageType;
  created_at: string;
}
