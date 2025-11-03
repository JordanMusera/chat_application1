import express from "express";
import cors from "cors";
import db from "./config/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/userRoute";
import messageRoutes from "./routes/messageRoute";
import { Server } from "socket.io";
import http from "http";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.0.159:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoutes);
app.use("/users",userRoutes);
app.use("/messages",messageRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.0.159:3000"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("send_message", async (data) => {
    const { chatId, senderId, content } = data;

    if (!chatId || !senderId || !content || !content.trim()) {
      console.error("Invalid message data:", data);
      return;
    }

    try {
      const [result] = await db.query(
        "INSERT INTO messages (chat_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())",
        [chatId, senderId, content.trim()]
      );

      const messageData = {
        id: (result as any).insertId,
        chatId,
        senderId,
        content: content.trim(),
        time: new Date().toLocaleTimeString(),
      };

      console.log("Message saved:", messageData);
      io.to(chatId).emit("receive_message", messageData);
    } catch (error) {
      console.error("Error inserting message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
