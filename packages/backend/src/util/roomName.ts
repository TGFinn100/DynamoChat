export function roomNameFromCode(roomCode: string): string {
  return `ron-${roomCode.trim().toLowerCase()}`;
}
