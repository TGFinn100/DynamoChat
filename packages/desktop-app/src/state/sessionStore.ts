import { create } from "zustand";
import { nanoid } from "nanoid";
import { Room, RoomEvent, Track } from "livekit-client";
import { MAIN_CHANNEL, teamChannelId, type ChannelId } from "@ron-voice/shared";
import { createRoom as apiCreateRoom, fetchToken, HttpError } from "../lib/backendClient";
import { connectToRoom, getParticipantChannel, setLocalChannel } from "../lib/livekitClient";
import { attachChannelRouting, type ChannelRouting } from "../lib/channelRouting";
import { playChannelSwitchCue, setCueOutputDevice } from "../lib/audioCues";
import { retryWithWakeUp } from "../lib/retry";
import {
  getSavedInputDeviceId,
  getSavedOutputDeviceId,
  saveInputDeviceId,
  saveOutputDeviceId,
} from "../lib/deviceSettings";
import {
  broadcastTeamAdded,
  decodeTeamSyncMessage,
  sendTeamsSyncTo,
  type TeamInfo,
} from "../lib/teamSync";

let activeRouting: ChannelRouting | null = null;
let unsubscribeHotkeys: (() => void) | null = null;

const DISPLAY_NAME_KEY = "ron-voice:display-name";

function getSavedDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  channel: ChannelId;
  audible: boolean;
  speaking: boolean;
}

interface SessionState {
  screen: "join" | "lobby";
  backendUrl: string;
  displayName: string;
  roomCode: string;
  status: string;
  room: Room | null;
  isHost: boolean;
  createdRoomCode: string | null;
  teams: TeamInfo[];
  participants: ParticipantInfo[];
  lastTeamChannel: ChannelId | null;
  selectedInputDevice: string | null;
  selectedOutputDevice: string | null;
  showSettings: boolean;
  showStats: boolean;

  setBackendUrl: (value: string) => void;
  setShowSettings: (value: boolean) => void;
  setShowStats: (value: boolean) => void;
  setDisplayName: (value: string) => void;
  setRoomCode: (value: string) => void;
  createRoom: () => Promise<void>;
  join: () => Promise<void>;
  leave: () => void;
  addTeam: (name: string) => Promise<void>;
  moveLocalParticipantToChannel: (channel: ChannelId) => Promise<void>;
  toggleMainChannel: () => Promise<void>;
  setInputDevice: (deviceId: string) => Promise<void>;
  setOutputDevice: (deviceId: string) => Promise<void>;
}

function describeError(err: unknown): string {
  if (err instanceof HttpError) {
    return err.message;
  }
  // fetch throws these on a network failure/timeout, not a definitive server
  // response - everything else (mic-permission errors, LiveKit connect
  // errors) already carries its own specific, actionable message.
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Could not reach the server. Check your internet connection and try again.";
  }
  if (err instanceof TypeError) {
    return "Could not reach the server. Check your internet connection and try again.";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

function isAudioAudible(publications: Map<string, { kind: Track.Kind; isSubscribed?: boolean }>): boolean {
  for (const pub of publications.values()) {
    if (pub.kind === Track.Kind.Audio && pub.isSubscribed) {
      return true;
    }
  }
  return false;
}

// Structural refreshes (join/leave/track change) don't know who's actively
// speaking right now - that comes from a separate, more frequent LiveKit
// event (ActiveSpeakersChanged) - so carry forward whatever we last knew
// rather than flashing every participant's indicator off on every refresh.
function refreshParticipants(room: Room, previous: ParticipantInfo[] = []): ParticipantInfo[] {
  const wasSpeaking = new Set(previous.filter((p) => p.speaking).map((p) => p.identity));
  const list: ParticipantInfo[] = [
    {
      identity: room.localParticipant.identity,
      name: room.localParticipant.name || room.localParticipant.identity,
      isLocal: true,
      channel: getParticipantChannel(room.localParticipant.attributes),
      audible: true,
      speaking: wasSpeaking.has(room.localParticipant.identity),
    },
  ];
  room.remoteParticipants.forEach((participant) => {
    list.push({
      identity: participant.identity,
      name: participant.name || participant.identity,
      isLocal: false,
      channel: getParticipantChannel(participant.attributes),
      audible: isAudioAudible(participant.trackPublications),
      speaking: wasSpeaking.has(participant.identity),
    });
  });
  return list;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  screen: "join",
  backendUrl: "https://ron-voice-backend.onrender.com",
  displayName: getSavedDisplayName(),
  roomCode: "",
  status: "Not connected.",
  room: null,
  isHost: false,
  createdRoomCode: null,
  teams: [],
  participants: [],
  lastTeamChannel: null,
  selectedInputDevice: getSavedInputDeviceId(),
  selectedOutputDevice: getSavedOutputDeviceId(),
  showSettings: false,
  showStats: false,

  setBackendUrl: (value) => set({ backendUrl: value }),
  setShowSettings: (value) => set({ showSettings: value }),
  setShowStats: (value) => set({ showStats: value }),
  setDisplayName: (value) => {
    localStorage.setItem(DISPLAY_NAME_KEY, value);
    set({ displayName: value });
  },
  setRoomCode: (value) => set({ roomCode: value }),

  createRoom: async () => {
    try {
      set({ status: "Creating room..." });
      const { roomCode } = await retryWithWakeUp(
        () => apiCreateRoom(get().backendUrl.trim()),
        {
          onWaking: () =>
            set({ status: "Waking up the server... this can take up to a minute." }),
        },
      );
      set({ roomCode, createdRoomCode: roomCode, status: `Room created: ${roomCode}` });
    } catch (err) {
      set({ status: `Error creating room: ${describeError(err)}` });
    }
  },

  join: async () => {
    const { backendUrl, roomCode, displayName } = get();
    if (!roomCode.trim() || !displayName.trim()) {
      set({ status: "Enter a display name and room code first." });
      return;
    }

    try {
      set({ status: "Fetching token..." });
      const { token, livekitUrl } = await retryWithWakeUp(
        () => fetchToken(backendUrl.trim(), roomCode.trim(), displayName.trim()),
        {
          onWaking: () =>
            set({ status: "Waking up the server... this can take up to a minute." }),
        },
      );

      set({ status: "Connecting to voice..." });
      const room = await connectToRoom(livekitUrl, token);
      const isHost = get().createdRoomCode === roomCode.trim();
      activeRouting = attachChannelRouting(room);

      unsubscribeHotkeys = window.hotkeys.onToggleMain(() => {
        void get().toggleMainChannel();
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        set({ participants: refreshParticipants(room, get().participants) });
        if (get().isHost) {
          void sendTeamsSyncTo(room.localParticipant, get().teams, participant.identity);
        }
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        set({ participants: refreshParticipants(room, get().participants) });
      });
      room.on(RoomEvent.ParticipantAttributesChanged, () => {
        set({ participants: refreshParticipants(room, get().participants) });
      });
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          document.body.appendChild(track.attach());
        }
        set({ participants: refreshParticipants(room, get().participants) });
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach().forEach((el) => el.remove());
        }
        set({ participants: refreshParticipants(room, get().participants) });
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const speakingIds = new Set(speakers.map((s) => s.identity));
        set({
          participants: get().participants.map((p) => ({
            ...p,
            speaking: speakingIds.has(p.identity),
          })),
        });
      });
      room.on(RoomEvent.DataReceived, (payload) => {
        const message = decodeTeamSyncMessage(payload);
        if (!message) return;
        if (message.type === "team-added") {
          const exists = get().teams.some((t) => t.id === message.team.id);
          if (!exists) {
            set({ teams: [...get().teams, message.team] });
          }
        } else if (message.type === "teams-sync") {
          set({ teams: message.teams });
        }
      });
      room.on(RoomEvent.Disconnected, () => {
        activeRouting?.detach();
        activeRouting = null;
        unsubscribeHotkeys?.();
        unsubscribeHotkeys = null;
        set({
          screen: "join",
          room: null,
          status: "Disconnected.",
          participants: [],
          teams: [],
          isHost: false,
          createdRoomCode: null,
          lastTeamChannel: null,
        });
      });

      room.on(RoomEvent.Reconnecting, () => {
        set({ status: "Connection lost, reconnecting..." });
      });
      room.on(RoomEvent.Reconnected, () => {
        const myChannel = getParticipantChannel(room.localParticipant.attributes);
        void setLocalChannel(room, myChannel).then(() => {
          activeRouting?.reconcileAll();
          set({
            participants: refreshParticipants(room, get().participants),
            status: `Connected to ${get().roomCode.trim()}`,
          });
        });
      });

      set({
        room,
        screen: "lobby",
        isHost,
        status: `Connected to ${roomCode.trim()}`,
        participants: refreshParticipants(room),
      });
    } catch (err) {
      set({ status: `Error joining room: ${describeError(err)}` });
    }
  },

  leave: () => {
    void get().room?.disconnect();
  },

  addTeam: async (name: string) => {
    const { room } = get();
    if (!room) return;
    const team: TeamInfo = { id: teamChannelId(nanoid(6)), name };
    set({ teams: [...get().teams, team] });
    await broadcastTeamAdded(room.localParticipant, team);
  },

  moveLocalParticipantToChannel: async (channel: ChannelId) => {
    const { room } = get();
    if (!room) return;
    await setLocalChannel(room, channel);
    activeRouting?.reconcileAll();
    set({
      participants: refreshParticipants(room, get().participants),
      ...(channel !== MAIN_CHANNEL ? { lastTeamChannel: channel } : {}),
    });
    playChannelSwitchCue(channel);
  },

  toggleMainChannel: async () => {
    const { participants, lastTeamChannel, moveLocalParticipantToChannel } = get();
    const me = participants.find((p) => p.isLocal);
    if (!me) return;

    if (me.channel === MAIN_CHANNEL) {
      if (lastTeamChannel) {
        await moveLocalParticipantToChannel(lastTeamChannel);
      }
    } else {
      await moveLocalParticipantToChannel(MAIN_CHANNEL);
    }
  },

  setInputDevice: async (deviceId: string) => {
    saveInputDeviceId(deviceId);
    set({ selectedInputDevice: deviceId });
    const { room } = get();
    if (room) {
      await room.switchActiveDevice("audioinput", deviceId);
    }
  },

  setOutputDevice: async (deviceId: string) => {
    saveOutputDeviceId(deviceId);
    set({ selectedOutputDevice: deviceId });
    await setCueOutputDevice(deviceId);
    const { room } = get();
    if (room) {
      await room.switchActiveDevice("audiooutput", deviceId);
    }
  },
}));
