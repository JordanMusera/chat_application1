import { Request, Response } from "express";
import db from "../config/db";
import bcrypt from "bcrypt";
import { create_jwt } from "../functions/authFunctions";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if ((existing as any).length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query("INSERT INTO users (name,email,password) VALUES (?,?,?)", [
      name,
      email,
      hashedPassword,
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const signInUser = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberme } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Provide all fields" });

    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);

    if ((rows as any).length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = (rows as any)[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (validPassword) {
      const token = await create_jwt(user);

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: rememberme ? 60 * 60 * 1000 * 24 * 7 : 60 * 60 * 100,
      });

      return res.status(200).json({ message: "Login successful", token });
    } else {
      return res.status(400).json({ message: "Password is invalid" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyUser = (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
