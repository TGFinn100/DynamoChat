import type { RoomCodeResponse, TokenResponse } from "@ron-voice/shared";

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

async function fetchJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new HttpError(body.error ?? `Request failed (${res.status})`, res.status);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createRoom(
  backendUrl: string,
  timeoutMs = 5000,
): Promise<RoomCodeResponse> {
  return fetchJson<RoomCodeResponse>(`${backendUrl}/rooms`, { method: "POST" }, timeoutMs);
}

export async function fetchToken(
  backendUrl: string,
  roomCode: string,
  displayName: string,
  timeoutMs = 5000,
): Promise<TokenResponse> {
  return fetchJson<TokenResponse>(
    `${backendUrl}/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, displayName }),
    },
    timeoutMs,
  );
}
