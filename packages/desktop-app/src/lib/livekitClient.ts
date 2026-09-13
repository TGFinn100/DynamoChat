import { Room } from "livekit-client";
import { MAIN_CHANNEL, type ChannelId } from "@ron-voice/shared";

export async function connectToRoom(livekitUrl: string, token: string): Promise<Room> {
  const room = new Room();
  await room.connect(livekitUrl, token);
  await room.localParticipant.setMicrophoneEnabled(true);
  await setLocalChannel(room, MAIN_CHANNEL);
  return room;
}

export async function setLocalChannel(room: Room, channel: ChannelId): Promise<void> {
  await room.localParticipant.setAttributes({ channel });
}

export function getParticipantChannel(attributes: Record<string, string>): ChannelId {
  const channel = attributes.channel;
  return (channel as ChannelId) ?? MAIN_CHANNEL;
}
