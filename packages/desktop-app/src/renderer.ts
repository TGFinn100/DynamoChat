import "./index.css";
import { Room, RoomEvent } from "livekit-client";
import { createRoom, fetchToken } from "./lib/backendClient";
import { connectToRoom } from "./lib/livekitClient";

const backendUrlInput = document.getElementById("backend-url") as HTMLInputElement;
const displayNameInput = document.getElementById("display-name") as HTMLInputElement;
const roomCodeInput = document.getElementById("room-code") as HTMLInputElement;
const createRoomBtn = document.getElementById("create-room-btn") as HTMLButtonElement;
const joinBtn = document.getElementById("join-btn") as HTMLButtonElement;
const leaveBtn = document.getElementById("leave-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLParagraphElement;
const participantListEl = document.getElementById("participant-list") as HTMLUListElement;

let currentRoom: Room | null = null;

function setStatus(message: string): void {
  statusEl.textContent = message;
}

function renderParticipants(room: Room): void {
  participantListEl.innerHTML = "";

  const addItem = (name: string, isLocal: boolean) => {
    const li = document.createElement("li");
    li.textContent = isLocal ? `${name} (you)` : name;
    participantListEl.appendChild(li);
  };

  addItem(room.localParticipant.name || room.localParticipant.identity, true);
  room.remoteParticipants.forEach((participant) => {
    addItem(participant.name || participant.identity, false);
  });
}

function setConnectedUiState(connected: boolean): void {
  joinBtn.disabled = connected;
  createRoomBtn.disabled = connected;
  leaveBtn.disabled = !connected;
  roomCodeInput.disabled = connected;
  displayNameInput.disabled = connected;
  backendUrlInput.disabled = connected;
}

createRoomBtn.addEventListener("click", () => {
  void (async () => {
    try {
      setStatus("Creating room...");
      const { roomCode } = await createRoom(backendUrlInput.value.trim());
      roomCodeInput.value = roomCode;
      setStatus(`Room created: ${roomCode}`);
    } catch (err) {
      setStatus(`Error creating room: ${(err as Error).message}`);
    }
  })();
});

joinBtn.addEventListener("click", () => {
  void (async () => {
    const roomCode = roomCodeInput.value.trim();
    const displayName = displayNameInput.value.trim();
    const backendUrl = backendUrlInput.value.trim();

    if (!roomCode || !displayName) {
      setStatus("Enter a display name and room code first.");
      return;
    }

    try {
      setStatus("Fetching token...");
      const { token, livekitUrl } = await fetchToken(backendUrl, roomCode, displayName);

      setStatus("Connecting to voice...");
      const room = await connectToRoom(livekitUrl, token);
      currentRoom = room;

      room.on(RoomEvent.ParticipantConnected, () => renderParticipants(room));
      room.on(RoomEvent.ParticipantDisconnected, () => renderParticipants(room));
      room.on(RoomEvent.Disconnected, () => {
        setStatus("Disconnected.");
        setConnectedUiState(false);
        participantListEl.innerHTML = "";
        currentRoom = null;
      });

      setStatus(`Connected to ${roomCode}`);
      setConnectedUiState(true);
      renderParticipants(room);
    } catch (err) {
      setStatus(`Error joining room: ${(err as Error).message}`);
    }
  })();
});

leaveBtn.addEventListener("click", () => {
  void currentRoom?.disconnect();
});
