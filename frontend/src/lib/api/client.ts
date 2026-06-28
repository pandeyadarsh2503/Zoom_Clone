/**
 * Centralised HTTP client for all API communication.
 *
 * Design decisions:
 * - Native fetch — no axios dependency; fetch is available in all modern
 *   browsers and in Node 18+.
 * - Single baseURL derived from NEXT_PUBLIC_API_URL so the backend address
 *   is configured once in .env.local.
 * - Consistent error envelope: every non-2xx response is normalised into an
 *   ApiError with a machine-readable `code` and human-readable `message`.
 *   Callers never need to parse error shapes themselves.
 * - Adding auth later means inserting one Authorization header in the `headers`
 *   object — nothing else changes.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorEnvelope {
  detail: {
    code: string;
    message: string;
  };
}

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  // Attempt to parse the backend's error envelope.
  let code = "UNKNOWN_ERROR";
  let message = `Request failed with status ${response.status}.`;

  try {
    const body: ErrorEnvelope = await response.json();
    if (body?.detail?.code) code = body.detail.code;
    if (body?.detail?.message) message = body.detail.message;
  } catch {
    // Ignore JSON parse failures; use the defaults set above.
  }

  throw new ApiError(code, message, response.status);
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: buildHeaders(),
    }).then((res) => handleResponse<T>(res));
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => handleResponse<T>(res));
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${API_BASE_URL}${path}`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => handleResponse<T>(res));
  },

  delete<T>(path: string): Promise<T> {
    return fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then((res) => handleResponse<T>(res));
  },
};
