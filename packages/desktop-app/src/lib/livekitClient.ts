import { Room } from "livekit-client";
import { MAIN_CHANNEL, type ChannelId } from "@ron-voice/shared";
import { applySavedDevices, getSavedOutputDeviceId } from "./deviceSettings";
import { setCueOutputDevice } from "./audioCues";

export async function connectToRoom(livekitUrl: string, token: string): Promise<Room> {
  const room = new Room();
  await room.connect(livekitUrl, token, { autoSubscribe: false });

  try {
    await room.localParticipant.setMicrophoneEnabled(true);
  } catch {
    await room.disconnect();
    throw new Error(
      "Microphone access was denied or no microphone was found. Check Windows privacy settings (Settings > Privacy & security > Microphone) and try again.",
    );
  }

  await applySavedDevices(room);
  const savedOutput = getSavedOutputDeviceId();
  if (savedOutput) {
    try {
      await setCueOutputDevice(savedOutput);
    } catch {
      // Saved output device no longer exists - the cue falls back to default.
    }
  }

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
