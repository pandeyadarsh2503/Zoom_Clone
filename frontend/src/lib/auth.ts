/**
 * Bearer-token storage (localStorage).
 *
 * The token is read by the API client for the Authorization header and by the
 * WebSocket client (as a query param, since browsers can't set WS headers).
 */
const TOKEN_KEY = "zc.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
