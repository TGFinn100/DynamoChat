import type { LocalParticipant } from "livekit-client";
import type { ChannelId } from "@ron-voice/shared";

export interface TeamInfo {
  id: ChannelId;
  name: string;
}

export type TeamSyncMessage =
  | { type: "team-added"; team: TeamInfo }
  | { type: "teams-sync"; teams: TeamInfo[] };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeTeamSyncMessage(message: TeamSyncMessage): Uint8Array<ArrayBuffer> {
  return new Uint8Array(encoder.encode(JSON.stringify(message)));
}

export function decodeTeamSyncMessage(payload: Uint8Array): TeamSyncMessage | null {
  try {
    return JSON.parse(decoder.decode(payload)) as TeamSyncMessage;
  } catch {
    return null;
  }
}

export async function broadcastTeamAdded(
  localParticipant: LocalParticipant,
  team: TeamInfo,
): Promise<void> {
  await localParticipant.publishData(
    encodeTeamSyncMessage({ type: "team-added", team }),
    { reliable: true },
  );
}

export async function sendTeamsSyncTo(
  localParticipant: LocalParticipant,
  teams: TeamInfo[],
  destinationIdentity: string,
): Promise<void> {
  await localParticipant.publishData(
    encodeTeamSyncMessage({ type: "teams-sync", teams }),
    { reliable: true, destinationIdentities: [destinationIdentity] },
  );
}
