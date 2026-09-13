export type MainChannel = "main";
export type TeamChannelId = `team:${string}`;
export type ChannelId = MainChannel | TeamChannelId;

export const MAIN_CHANNEL: MainChannel = "main";

export function isTeamChannel(channel: ChannelId): channel is TeamChannelId {
  return channel.startsWith("team:");
}

export function teamChannelId(teamId: string): TeamChannelId {
  return `team:${teamId}`;
}

export interface ParticipantAttributes {
  channel: ChannelId;
  displayName: string;
}

export interface RoomCodeResponse {
  roomCode: string;
  roomName: string;
}

export interface TokenRequest {
  roomCode: string;
  displayName: string;
}

export interface TokenResponse {
  token: string;
  livekitUrl: string;
  roomName: string;
}
