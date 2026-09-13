export const OVERLAY_DATA_UPDATE = "overlay-data:update";

export interface OverlayParticipant {
  identity: string;
  name: string;
  /** Human-readable channel label ("Main", or the team's name), not the raw ChannelId. */
  channel: string;
  isLocal: boolean;
  speaking: boolean;
}

export interface OverlayData {
  /** Human-readable label for the local participant's channel, or null before connecting. */
  myChannel: string | null;
  participants: OverlayParticipant[];
}
