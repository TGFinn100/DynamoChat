const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

interface ActiveRoomEntry {
  roomName: string;
  createdAt: number;
}

const activeRooms = new Map<string, ActiveRoomEntry>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [code, entry] of activeRooms) {
    if (now - entry.createdAt > ROOM_TTL_MS) {
      activeRooms.delete(code);
    }
  }
}

export function registerRoomCode(roomCode: string, roomName: string): void {
  purgeExpired();
  activeRooms.set(roomCode.toUpperCase(), { roomName, createdAt: Date.now() });
}

export function isValidRoomCode(roomCode: string): boolean {
  purgeExpired();
  return activeRooms.has(roomCode.toUpperCase());
}
