import { AccessToken } from "livekit-server-sdk";

export async function mintToken(params: {
  roomName: string;
  identity: string;
  displayName: string;
}): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY/LIVEKIT_API_SECRET are not configured");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.displayName,
    ttl: "6h",
  });
  at.addGrant({
    room: params.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return at.toJwt();
}
