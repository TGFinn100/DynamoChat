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

// Discord (and most chat apps) won't render a custom-scheme link like
// "ronvoice://..." as clickable - only http(s) and a small hardcoded
// allowlist. Share this https bridge page instead; it immediately hands off
// to the app link client-side. See the gh-pages branch's join/index.html.
export function buildDeepLink(roomCode: string): string {
  return `https://tgfinn100.github.io/DynamoChat/join/?code=${roomCode.toLowerCase()}`;
}
