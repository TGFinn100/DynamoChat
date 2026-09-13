import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { TokenRequest, TokenResponse } from "@ron-voice/shared";
import { mintToken } from "../livekit/tokens.js";
import { roomNameFromCode } from "../util/roomName.js";

export const tokenRouter = Router();

tokenRouter.post("/token", async (req, res) => {
  const body = req.body as Partial<TokenRequest>;
  const roomCode = body.roomCode?.trim();
  const displayName = body.displayName?.trim();

  if (!roomCode || !displayName) {
    res.status(400).json({ error: "roomCode and displayName are required" });
    return;
  }

  const roomName = roomNameFromCode(roomCode);
  const identity = `${displayName}-${randomUUID().slice(0, 8)}`;

  try {
    const token = await mintToken({ roomName, identity, displayName });
    const response: TokenResponse = {
      token,
      livekitUrl: process.env.LIVEKIT_URL ?? "",
      roomName,
    };
    res.json(response);
  } catch (err) {
    console.error("Failed to mint LiveKit token:", err);
    res.status(500).json({ error: "Failed to mint token" });
  }
});
