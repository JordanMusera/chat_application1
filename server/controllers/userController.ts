import { sql, pool, poolConnect } from "../config/db";
import { Request, Response } from "express";
import { verifyToken } from "../functions/authFunctions";
import { Int, NVarChar } from "mssql";

export const getUserConv = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    console.log("UserId: " + user_id);

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "user_id required" });
    }

    await poolConnect;

    const selectRequest = new sql.Request(pool);
    selectRequest.input("UserId", Int, user_id);

    const query = `
      SELECT 
          c.id AS chat_id,
          u.id AS id,
          u.name AS name,
          u.avatar,
          m.content AS lastMessage,
          m.timestamp AS last_message_time
      FROM chats c
      JOIN chatmembers cm1 
          ON c.id = cm1.chat_id
      JOIN chatmembers cm2 
          ON c.id = cm2.chat_id 
        AND cm2.user_id != @UserId
      JOIN users u 
          ON cm2.user_id = u.id
      LEFT JOIN messages m 
          ON m.chat_id = c.id
      WHERE cm1.user_id = @UserId
        AND m.timestamp = (
            SELECT MAX(m2.timestamp)
            FROM messages m2
            WHERE m2.chat_id = c.id
        )
      ORDER BY m.timestamp DESC;
    `;

    const selectResponse = await selectRequest.query(query);

    res.status(200).json({ success: true, users: selectResponse.recordset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = await verifyToken(token);
    const userId = user.id;

    const selectRequest = new sql.Request(pool);
    selectRequest.input("UserId", Int, userId);
    const selectResponse = await selectRequest.query(
      "SELECT * FROM users WHERE id=@UserId"
    );

    const userData = selectResponse.recordset[0];
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
  }
};

export const getSearchUsers = async (req: Request, res: Response) => {
  try {
    const { searchWord } = req.body;

    const selectRequest = new sql.Request(pool);
    selectRequest.input("SearchWord", NVarChar, `%${searchWord}%`);
    const selectResponse = await selectRequest.query(
      "SELECT id,name,email,avatar FROM users WHERE name LIKE @SearchWord OR email LIKE @SearchWord"
    );

    if (selectResponse) {
      res
        .status(200)
        .json({ success: true, content: selectResponse.recordset });
    } else {
      res
        .status(404)
        .json({ success: false, content: null, message: "Not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Some server error occurred" });
  }
};
