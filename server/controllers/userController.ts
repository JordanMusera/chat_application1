import db from "../config/db";
import { Request, Response } from "express";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
          c.id AS chat_id,
          u.id AS id,
          u.name AS name,
          u.avatar,
          m.content AS lastMessage,
          m.timestamp AS last_message_time
      FROM chats c
      JOIN chatmembers cm1 ON c.id = cm1.chat_id
      JOIN chatmembers cm2 ON c.id = cm2.chat_id AND cm2.user_id != ?
      JOIN users u ON cm2.user_id = u.id
      LEFT JOIN messages m ON m.chat_id = c.id
      WHERE cm1.user_id = ?
      AND m.timestamp = (
          SELECT MAX(m2.timestamp)
          FROM messages m2
          WHERE m2.chat_id = c.id
      )
      ORDER BY m.timestamp DESC;
      `,
      [1, 1]
    );

    console.log("Fetched chat list:");
    console.log(JSON.stringify(rows, null, 2));

    res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};
