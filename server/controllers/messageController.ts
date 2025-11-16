import { Request, Response } from "express";
import db from "../config/db";
import crypto from "crypto";
import { getIO } from "../socket";
import { uploadFileToCloudinary } from "../services/cloudinaryService";

export const getMessagesByChatId = async (req: Request, res: Response) => {
  const { chat_id } = req.body;

  try {
    const [messages]: any = await db.query(
      `
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        u.name AS sender_name,
        m.content,
        m.timestamp
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = ?
      ORDER BY m.timestamp ASC
      `,
      [chat_id]
    );

    if (messages.length === 0) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messageIds = messages.map((m: any) => m.id);
    const [files]: any = await db.query(
      `SELECT * FROM message_files WHERE message_id IN (?)`,
      [messageIds]
    );

    const messagesWithFiles = messages.map((msg: any) => {
      const msgFiles = files.filter((f: any) => f.message_id === msg.id);
      return {
        ...msg,
        file: msgFiles?.[0],
      };
    });

    return res.status(200).json({ success: true, messages: messagesWithFiles });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching messages" });
  }
};


export const postMessage = async (req: Request, res: Response) => {
  const io = getIO();
  const { chat_id, sender_id, receiver_id, content, newConvId, file_type } =
    req.body;
  const file = req.file;

  if (!receiver_id || !sender_id || !content || !content.trim()) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  try {
    let activeChatId = parseInt(chat_id || "0");

    if (activeChatId === 0) {
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

      io.to(`user_${sender_id}`).emit("chat_created", {
        chat_id: activeChatId,
      });
    }

    let uploadedFile: { url: string; public_id: string } | null = null;
    if (file) {
      const result = await uploadFileToCloudinary(
        file.buffer,
        file.originalname
      );

      if ("success" in result && result.success === false) {
        console.error("Cloudinary upload failed:", result);
      } else {
        uploadedFile = result as unknown as { url: string; public_id: string };
        console.log(result);
      }
    }

    const [msgResult] = await db.query<any>(
      "INSERT INTO messages (chat_id, sender_id, content, timestamp) VALUES (?, ?, ?, NOW())",
      [activeChatId, sender_id, content.trim()]
    );

    const [row] = await db.query<any>("SELECT name FROM users WHERE id=?", [
      sender_id,
    ]);
    const sender_name = row[0].name;

    if (file) {
      await db.query<any>(
        "INSERT INTO message_files (message_id,name,url,type,public_id) VALUES (?,?,?,?,?)",
        [
          msgResult.insertId,
          file.originalname,
          uploadedFile?.url,
          file_type,
          uploadedFile?.public_id,
        ]
      );
    }

    const messageData = {
      id: msgResult.insertId,
      chat_id: activeChatId,
      sender_name,
      sender_id,
      receiver_id,
      content: content.trim(),

      ...(file && uploadedFile?{
         file: {
        name: file?.originalname,
        url: uploadedFile?.url,
        type: file_type,
        public_id: uploadedFile?.public_id,
      },
      }:{}),
     
      timestamp: new Date().toISOString(),
    };

    io.to(activeChatId.toString()).emit("receive_message", messageData);
    io.to(`user_${receiver_id}`).emit("newMessage", messageData);

    return res.status(200).json({ success: true, message: messageData });
  } catch (error) {
    console.error("Error inserting message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
