import { MAIN_CHANNEL, type ChannelId } from "@ron-voice/shared";
import { useSessionStore } from "../state/sessionStore";
import type { TeamInfo } from "./teamSync";
import type { OverlayData } from "./overlayDataChannel";

function channelLabel(channel: ChannelId, teams: TeamInfo[]): string {
  if (channel === MAIN_CHANNEL) return "Main";
  return teams.find((t) => t.id === channel)?.name ?? channel;
}

function buildOverlayData(): OverlayData {
  const { participants, teams } = useSessionStore.getState();
  const me = participants.find((p) => p.isLocal);
  return {
    myChannel: me ? channelLabel(me.channel, teams) : null,
    participants: participants.map((p) => ({
      identity: p.identity,
      name: p.name,
      channel: channelLabel(p.channel, teams),
      isLocal: p.isLocal,
      speaking: p.speaking,
    })),
  };
}

// Keeps the separate overlay window (a plain always-on-top BrowserWindow with
// no access to this renderer's zustand store) in sync with who's connected,
// who's on what channel, and who's currently talking - see main.ts's
// OVERLAY_DATA_UPDATE handler for the other end of this pipe.
export function startOverlayDataBridge(): () => void {
  window.overlayData.update(buildOverlayData());
  return useSessionStore.subscribe(() => {
    window.overlayData.update(buildOverlayData());
  });
}
