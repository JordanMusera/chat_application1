import { Request, Response } from "express";
import db from "../config/db";
import bcrypt from "bcrypt";
import {
  create_jwt,
  generateOTP,
  sendOTPToEmail,
} from "../functions/authFunctions";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { uploadFileToCloudinary } from "../services/cloudinaryService";

dotenv.config();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const image = req.file;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    let uploadedFile: { url: string; public_id: string } | null = null;
    if (image) {
      const result = await uploadFileToCloudinary(
        image.buffer,
        image.originalname
      );
      if (!("success" in result && result.success === false)) {
        uploadedFile = result as unknown as { url: string; public_id: string };
      }
    }

    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if ((existingUsers as any).length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await db.query<any>(
      "INSERT INTO users (name, email, avatar, password) VALUES (?, ?, ?, ?)",
      [name, email, uploadedFile?.url, hashedPassword]
    );

    const userId = (insertResult as any).insertId;
    if (!userId) throw new Error("User creation failed");

    const otp_code = generateOTP();
    const [existingRows] = await db.query<any[]>(
      "SELECT * FROM otp_codes WHERE user_id = ?",
      [userId]
    );

    if (existingRows.length > 0) {
      await db.query(
        "UPDATE otp_codes SET otp_code = ?, verified = false WHERE user_id = ?",
        [otp_code, userId]
      );
    } else {
      await db.query(
        "INSERT INTO otp_codes (user_id, otp_code, verified) VALUES (?, ?, false)",
        [userId, otp_code]
      );
    }

    await sendOTPToEmail(email, otp_code);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Check your email for OTP.",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

export const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Provide all fields" });

    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);

    if ((rows as any).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const user = (rows as any)[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (validPassword) {
      const token = await create_jwt(user);

      return res
        .status(200)
        .json({ success: true, message: "Login successful", token });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Password is invalid" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyUser = (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const query = `
      SELECT u.id as user_id, u.email, o.otp_code, o.verified
      FROM users u
      JOIN otp_codes o ON u.id = o.user_id
      WHERE u.email = ?
    `;

    const values = [email];
    const [row] = await db.query<any>(query, values);

    if (row.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No OTP found for this email" });
    }

    const otp_record = row[0];
    if (otp_record.verified) {
      return res
        .status(400)
        .json({ success: false, message: "Account already verified" });
    }

    if (otp_record.otp_code !== code) {
      console.log(otp_record.code);
      console.log(code);
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    await db.query("UPDATE otp_codes SET verified = true WHERE user_id = ?", [
      otp_record.user_id,
    ]);

    const [userRow] = await db.query<any>("SELECT * FROM users WHERE id=?", [
      otp_record.user_id,
    ]);

    const user = userRow[0];
    const token = await create_jwt(user);

    return res.json({ message: "Account verified successfully!", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
