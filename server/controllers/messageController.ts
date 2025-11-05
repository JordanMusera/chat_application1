import { Request, Response } from "express";
import db from "../config/db";

export const getMessagesByChatId = async (req: Request, res: Response) => {
  const { chat_id } = req.body;

  try {
    const [rows] = await db.query(
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

    console.log(rows)
    res.status(200).json({ success: true, messages: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching messages" });
  }
};
