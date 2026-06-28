export interface User {
  id: string;
  email: string | null;
  plan: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
}

export interface UserUpdate {
  display_name?: string;
  avatar_url?: string;
}
