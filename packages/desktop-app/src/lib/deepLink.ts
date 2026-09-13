export const DEEP_LINK_PROTOCOL = "ronvoice";
export const DEEP_LINK_JOIN_ROOM = "deeplink:join-room";

export function extractRoomCodeFromArgs(args: string[]): string | null {
  for (const arg of args) {
    if (!arg.startsWith(`${DEEP_LINK_PROTOCOL}://`)) continue;
    try {
      const url = new URL(arg);
      const code = url.hostname || url.pathname.replace(/^\/+/, "");
      return code ? code.toUpperCase() : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildDeepLink(roomCode: string): string {
  return `${DEEP_LINK_PROTOCOL}://${roomCode.toLowerCase()}`;
}
