import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import authRoutes from "./routes/auth";
import userRoutes from "./routes/userRoute";
import messageRoutes from "./routes/messageRoute";

import { initSocket } from "./socket";
import { socketHandler } from "./socket/socketHandler";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.1.131:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

const server = http.createServer(app);

const io = initSocket(server);
socketHandler(io);

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
