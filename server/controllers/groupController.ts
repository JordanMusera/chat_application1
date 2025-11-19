import { Request, Response } from "express";
import crypto from "crypto";
import { sql, pool, poolConnect } from "../config/db";
import { Bit, Int, NVarChar } from "mssql";
import { uploadFileToCloudinary } from "../services/cloudinaryService";
import { verifyToken } from "../functions/authFunctions";

export const createGroup = async (req: Request, res: Response) => {
  const { group_name, group_description } = req.body;
  let { group_members } = req.body;
  const avatar = req.file;
  try {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const user = await verifyToken(token);
    const userId = user.id;

    const randomChatName = `chat_${crypto.randomBytes(6).toString("hex")}`;

    await poolConnect;

    const insertChatRequest = new sql.Request(pool);
    insertChatRequest.input("ChatName", NVarChar, randomChatName);
    insertChatRequest.input("IsGroup", Bit, 1);
    const insertChatResponse = await insertChatRequest.query(
      "INSERT INTO chats (chat_name,isGroup) OUTPUT INSERTED.id VALUES (@ChatName,@IsGroup)"
    );
    const chat_id = insertChatResponse.recordset[0].id;

    let uploadedFile: { url: string; public_id: string } | null = null;
    if (avatar) {
      const result = await uploadFileToCloudinary(
        avatar.buffer,
        avatar.originalname
      );
      if (!("success" in result && result.success === false)) {
        uploadedFile = result as unknown as { url: string; public_id: string };
      }
    }

    const insertGroupSettingsRequest = new sql.Request(pool);
    insertGroupSettingsRequest.input("ChatId", Int, chat_id);
    insertGroupSettingsRequest.input("Name", NVarChar, group_name);
    insertGroupSettingsRequest.input(
      "Description",
      NVarChar,
      group_description
    );
    insertGroupSettingsRequest.input(
      "Avatar",
      NVarChar,
      uploadedFile ? uploadedFile.url : null
    );
    await insertGroupSettingsRequest.query(
      "INSERT INTO group_settings (chat_id,name,description,avatar) VALUES (@ChatId,@Name,@Description,@Avatar)"
    );

    if (typeof group_members === "string") {
      group_members = JSON.parse(group_members);
    }
    const membersToInsert = Array.isArray(group_members)
      ? [...group_members.map((u: any) => u.id), userId]
      : [userId];
    for (const id of membersToInsert) {
      await pool
        .request()
        .input("ChatId", Int, chat_id)
        .input("UserId", Int, id)
        .query(
          "INSERT INTO chatmembers (chat_id,user_id) VALUES (@ChatId,@UserId)"
        );
    }

    return res
      .status(201)
      .json({ success: true, message: "Group Created Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

export const fetchGroups = async (req: Request, res: Response) => {
  await poolConnect;

  if (!req.headers.authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = req.headers.authorization.split(" ")[1];
  const user = await verifyToken(token);
  const userId = user.id;

  try {
    const getGroupConvoRequest = new sql.Request(pool);
    getGroupConvoRequest.input("UserId", Int, userId);

    const query = `
      SELECT 
        gs.id,
        gs.chat_id,
        gs.name,
        gs.description,
        gs.avatar,
        gs.allow_members_to_add,
        gs.allow_members_to_post
      FROM group_settings gs
      INNER JOIN chatmembers cm ON cm.chat_id = gs.chat_id
      WHERE cm.user_id = @UserId;
    `;

    const getGroupConvoResponse = await getGroupConvoRequest.query(query);

    const groupsConvo = getGroupConvoResponse.recordset;

    return res.status(200).json({ success: true, groups: groupsConvo });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const fetchConvMessages = async (req: Request, res: Response) => {
  const { chat_id } = req.body;

  try {
    await poolConnect;

    const request = new sql.Request(pool);
    request.input("ChatId", sql.Int, chat_id);

    const query = `
      SELECT 
        m.id AS message_id,
        m.chat_id,
        m.sender_id,
        u.name AS sender_name,
        u.avatar AS avatar,
        m.content,
        mf.name AS file_name,
        mf.url AS file_url,
        mf.type AS file_type,
        mf.public_id AS file_public_id,
        m.timestamp
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      LEFT JOIN message_files mf ON mf.message_id = m.id
      WHERE m.chat_id = @ChatId
      ORDER BY m.timestamp ASC;
    `;

    const result = await request.query(query);

    return res.status(200).json({
      success: true,
      content: result.recordset
    });

  } catch (error: any) {
    console.error("Fetch Conv Messages Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching messages",
      error: error.message
    });
  }
};

