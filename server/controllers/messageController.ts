import { Request, Response } from "express";
import { sql, pool, poolConnect } from "../config/db";
import crypto from "crypto";
import { getIO } from "../socket";
import { uploadFileToCloudinary } from "../services/cloudinaryService";
import { Int, NVarChar } from "mssql";

export const getMessagesByChatId = async (req: Request, res: Response) => {
  const { chat_id } = req.body;

  try {
    await poolConnect;

    const selectRequest = new sql.Request(pool);
    selectRequest.input("ChatId", Int, chat_id);

    const query = `
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        u.name AS sender_name,
        m.content,
        m.timestamp
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = @ChatId
      ORDER BY m.timestamp ASC
    `;

    const selectResponse = await selectRequest.query(query);
    const messages = selectResponse.recordset;

    if (messages.length === 0) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messageIds = messages.map((m: any) => m.id);
    const idList = messageIds.join(",");

    const selectFileResponse = await new sql.Request(pool).query(`
      SELECT *
      FROM message_files 
      WHERE message_id IN (${idList})
    `);

    const files = selectFileResponse.recordset;

    const messagesWithFiles = messages.map((msg: any) => {
      const msgFiles = files.filter((f: any) => f.message_id === msg.id);
      return {
        ...msg,
        file: msgFiles?.[0] || null,
      };
    });

    return res.status(200).json({ success: true, messages: messagesWithFiles });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error fetching messages",
    });
  }
};

export const postMessage = async (req: Request, res: Response) => {
  const io = getIO();
  const { chat_id, sender_id, receiver_id, content, newConvId, file_type } =
    req.body;
  const file = req.file;

  await poolConnect;

  console.log("Chat id: ", chat_id);

  if (!receiver_id || !sender_id || !content || !content.trim()) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  try {
    let activeChatId = parseInt(chat_id || "0");

    if (activeChatId === 0) {
      const randomChatName = `chat_${crypto.randomBytes(6).toString("hex")}`;

      const insertChatRequest = new sql.Request(pool);
      insertChatRequest.input("ChatName", NVarChar, randomChatName);
      const insertChatResponse = await insertChatRequest.query(
        "INSERT INTO chats (chat_name,isGroup) OUTPUT INSERTED.id VALUES (@ChatName,0)"
      );

      activeChatId = insertChatResponse.recordset[0].id;

      const insertChatMembersRequest = new sql.Request(pool);
      insertChatMembersRequest.input("ActiveChatId", Int, activeChatId);
      insertChatMembersRequest.input("SenderId", Int, sender_id);
      insertChatMembersRequest.input("ReceiverId", Int, receiver_id);

      await insertChatMembersRequest.query(
        "INSERT INTO chatmembers (chat_id,user_id) VALUES (@ActiveChatId,@SenderId),(@ActiveChatId,@ReceiverId)"
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
      if (!("success" in result && result.success === false)) {
        uploadedFile = result as unknown as { url: string; public_id: string };
      }
    }

    const insertIntoMessageRequest = new sql.Request(pool);
    insertIntoMessageRequest.input("ChatId", Int, activeChatId);
    insertIntoMessageRequest.input("SenderId", Int, sender_id);
    insertIntoMessageRequest.input("Content", NVarChar, content.trim());

    const insertMessageResponse = await insertIntoMessageRequest.query(
      "INSERT INTO messages (chat_id,sender_id,content,timestamp) OUTPUT INSERTED.id VALUES (@ChatId,@SenderId,@Content,GETDATE())"
    );

    const selectNameRequest = new sql.Request(pool);
    selectNameRequest.input("SenderId", Int, sender_id);

    const selectNameResponse = await selectNameRequest.query(
      "SELECT name FROM users WHERE id=@SenderId"
    );

    const sender_name = selectNameResponse.recordset[0].name;

    if (file) {
      const insertMessageRequest = new sql.Request(pool);
      insertMessageRequest.input(
        "MessageId",
        Int,
        insertMessageResponse.recordset[0].id
      );
      insertMessageRequest.input("Name", NVarChar, file.originalname);
      insertMessageRequest.input("Url", NVarChar, uploadedFile?.url);
      insertMessageRequest.input("Type", NVarChar, file_type);
      insertMessageRequest.input("PublicId", NVarChar, uploadedFile?.public_id);

      await insertMessageRequest.query(
        "INSERT INTO message_files (message_id,name,url,type,public_id) VALUES (@MessageId,@Name,@Url,@Type,@PublicId)"
      );
    }

    const messageData = {
      id: insertMessageResponse.recordset[0].id,
      chat_id: activeChatId,
      sender_name,
      sender_id: Number(sender_id),
      receiver_id: Number(receiver_id),
      content: content.trim(),
      ...(file && uploadedFile
        ? {
            file: {
              name: file.originalname,
              url: uploadedFile.url,
              type: file_type,
              public_id: uploadedFile.public_id,
            },
          }
        : {}),
      timestamp: new Date().toISOString(),
    };

    const fetchIdRequest = new sql.Request(pool);
    fetchIdRequest.input("ChatId", Int, chat_id);
    const fetchIdResponse = await fetchIdRequest.query(
      "SELECT user_id FROM chatmembers WHERE chat_id=@ChatId"
    );

    const receiversList = fetchIdResponse.recordset
      .map((u) => u.user_id)
      .filter((id) => id !== sender_id);

    io.to(activeChatId.toString()).emit("receive_message", messageData);

    for (let id of receiversList) {
      io.to(`user_${id}`).emit("newMessage", messageData);
    }

    return res.status(200).json({ success: true, message: messageData });
  } catch (error) {
    console.error("Error inserting message:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
