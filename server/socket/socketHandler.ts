import { Server } from "socket.io";
import db from "../config/db";


const onlineUsers = new Map<number, string>();

export const socketHandler = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("register", (userId: number) => {
      onlineUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room user_${userId}`);
    });

    socket.on("join_chat", (chatId) => {
      socket.join(chatId.toString());
      console.log(`Joined chat ${chatId}`);
    });

    socket.on("send_message", (messageData) => {
      io.to(messageData.chat_id.toString()).emit("receive_message", messageData);
      io.to(`user_${messageData.receiver_id}`).emit("newMessage", messageData);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
