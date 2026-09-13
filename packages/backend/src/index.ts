import express from "express";
import cors from "cors";
import "dotenv/config";
import { roomsRouter } from "./routes/rooms.js";
import { tokenRouter } from "./routes/token.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(roomsRouter);
app.use(tokenRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
