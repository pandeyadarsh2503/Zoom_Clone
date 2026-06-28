import { apiClient } from "./client";
import type { User } from "@/types/user";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
}

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/v1/auth/register", payload);
  },
  login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/api/v1/auth/login", { email, password });
  },
};
