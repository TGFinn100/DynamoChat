import { Router } from "express";
import type { RoomCodeResponse } from "@ron-voice/shared";
import { generateRoomCode } from "../util/roomCode.js";
import { roomNameFromCode } from "../util/roomName.js";

export const roomsRouter = Router();

roomsRouter.post("/rooms", (_req, res) => {
  const roomCode = generateRoomCode();
  const response: RoomCodeResponse = {
    roomCode,
    roomName: roomNameFromCode(roomCode),
  };
  res.json(response);
});
