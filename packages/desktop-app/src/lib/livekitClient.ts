import { Room } from "livekit-client";

export async function connectToRoom(livekitUrl: string, token: string): Promise<Room> {
  const room = new Room();
  await room.connect(livekitUrl, token);
  await room.localParticipant.setMicrophoneEnabled(true);
  return room;
}
