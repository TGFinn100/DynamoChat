import type { RoomCodeResponse, TokenResponse } from "@ron-voice/shared";

export async function createRoom(backendUrl: string): Promise<RoomCodeResponse> {
  const res = await fetch(`${backendUrl}/rooms`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Failed to create room (${res.status})`);
  }
  return res.json() as Promise<RoomCodeResponse>;
}

export async function fetchToken(
  backendUrl: string,
  roomCode: string,
  displayName: string,
): Promise<TokenResponse> {
  const res = await fetch(`${backendUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, displayName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to fetch token (${res.status})`);
  }
  return res.json() as Promise<TokenResponse>;
}
