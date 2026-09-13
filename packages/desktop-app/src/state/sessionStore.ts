import { create } from "zustand";
import { nanoid } from "nanoid";
import { Room, RoomEvent } from "livekit-client";
import { teamChannelId, type ChannelId } from "@ron-voice/shared";
import { createRoom as apiCreateRoom, fetchToken } from "../lib/backendClient";
import { connectToRoom, getParticipantChannel, setLocalChannel } from "../lib/livekitClient";
import {
  broadcastTeamAdded,
  decodeTeamSyncMessage,
  sendTeamsSyncTo,
  type TeamInfo,
} from "../lib/teamSync";

export interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  channel: ChannelId;
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

  setBackendUrl: (value: string) => void;
  setDisplayName: (value: string) => void;
  setRoomCode: (value: string) => void;
  createRoom: () => Promise<void>;
  join: () => Promise<void>;
  leave: () => void;
  addTeam: (name: string) => Promise<void>;
  moveLocalParticipantToChannel: (channel: ChannelId) => Promise<void>;
}

function refreshParticipants(room: Room): ParticipantInfo[] {
  const list: ParticipantInfo[] = [
    {
      identity: room.localParticipant.identity,
      name: room.localParticipant.name || room.localParticipant.identity,
      isLocal: true,
      channel: getParticipantChannel(room.localParticipant.attributes),
    },
  ];
  room.remoteParticipants.forEach((participant) => {
    list.push({
      identity: participant.identity,
      name: participant.name || participant.identity,
      isLocal: false,
      channel: getParticipantChannel(participant.attributes),
    });
  });
  return list;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  screen: "join",
  backendUrl: "http://localhost:3001",
  displayName: "",
  roomCode: "",
  status: "Not connected.",
  room: null,
  isHost: false,
  createdRoomCode: null,
  teams: [],
  participants: [],

  setBackendUrl: (value) => set({ backendUrl: value }),
  setDisplayName: (value) => set({ displayName: value }),
  setRoomCode: (value) => set({ roomCode: value }),

  createRoom: async () => {
    try {
      set({ status: "Creating room..." });
      const { roomCode } = await apiCreateRoom(get().backendUrl.trim());
      set({ roomCode, createdRoomCode: roomCode, status: `Room created: ${roomCode}` });
    } catch (err) {
      set({ status: `Error creating room: ${(err as Error).message}` });
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
      const { token, livekitUrl } = await fetchToken(
        backendUrl.trim(),
        roomCode.trim(),
        displayName.trim(),
      );

      set({ status: "Connecting to voice..." });
      const room = await connectToRoom(livekitUrl, token);
      const isHost = get().createdRoomCode === roomCode.trim();

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        set({ participants: refreshParticipants(room) });
        if (get().isHost) {
          void sendTeamsSyncTo(room.localParticipant, get().teams, participant.identity);
        }
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        set({ participants: refreshParticipants(room) });
      });
      room.on(RoomEvent.ParticipantAttributesChanged, () => {
        set({ participants: refreshParticipants(room) });
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
        set({
          screen: "join",
          room: null,
          status: "Disconnected.",
          participants: [],
          teams: [],
          isHost: false,
          createdRoomCode: null,
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
      set({ status: `Error joining room: ${(err as Error).message}` });
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
    set({ participants: refreshParticipants(room) });
  },
}));
