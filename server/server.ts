import express from "express";
import cors from "cors";
import db from "./config/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/userRoute";
import messageRoutes from "./routes/messageRoute";
import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";

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
app.use("/users", userRoutes);
app.use("/messages", messageRoutes);

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
    socket.join(chatId.toString());
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("send_message", async (data) => {
    const { chat_id, sender_id, receiver_id, content } = data;

    if (!receiver_id || !sender_id || !content || !content.trim()) {
      console.error("Invalid message data:", data);
      return;
    }

    try {
      let activeChatId = chat_id;

      if (chat_id === 0) {
        const randomChatName = `chat_${crypto.randomBytes(6).toString("hex")}`;
        const [chatRows]: any = await db.query(
          "INSERT INTO chats (chat_name, isGroup) VALUES (?, ?)",
          [randomChatName, 0]
        );

        activeChatId = chatRows.insertId;

        await db.query(
          "INSERT INTO chatmembers (chat_id, user_id) VALUES (?, ?), (?, ?)",
          [activeChatId, sender_id, activeChatId, receiver_id]
        );

        socket.join(activeChatId.toString());
        socket.emit("chat_created", { chat_id: activeChatId });
      }

      const [msgResult]: any = await db.query(
        "INSERT INTO messages (chat_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())",
        [activeChatId, sender_id, content.trim()]
      );

      const messageData = {
        id: msgResult.insertId,
        chat_id: activeChatId,
        sender_id,
        receiver_id,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      io.to(activeChatId.toString()).emit("receive_message", messageData);
      console.log("Message saved and emitted:", messageData);
    } catch (error) {
      console.error("Error inserting message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
