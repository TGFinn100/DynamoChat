import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const generateRoomCode = customAlphabet(ALPHABET, 6);
