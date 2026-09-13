import { Router } from "express";
import type { RoomCodeResponse } from "@ron-voice/shared";
import { generateRoomCode } from "../util/roomCode.js";
import { roomNameFromCode } from "../util/roomName.js";
import { registerRoomCode } from "../util/activeRooms.js";

export const roomsRouter = Router();

roomsRouter.post("/rooms", (_req, res) => {
  const roomCode = generateRoomCode();
  const roomName = roomNameFromCode(roomCode);
  registerRoomCode(roomCode, roomName);
  const response: RoomCodeResponse = { roomCode, roomName };
  res.json(response);
});
