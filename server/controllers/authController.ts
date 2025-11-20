import { Request, Response } from "express";
import { sql, pool, poolConnect } from "../config/db";
import bcrypt from "bcrypt";
import {
  create_jwt,
  generateOTP,
} from "../functions/authFunctions";
import { sendOTPToEmail } from "../services/mailService";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { uploadFileToCloudinary } from "../services/cloudinaryService";
import { Int, NVarChar } from "mssql";

dotenv.config();

export const registerUser = async (req: Request, res: Response) => {
  try {
    console.log("registerUser started");

    const { name, email, password } = req.body;
    const image = req.file;

    console.log("Received data:", { name, email, password, imageExists: !!image });

    if (!name || !email || !password) {
      console.log("Validation failed: missing fields");
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    await poolConnect;
    console.log("Connected to SQL pool");

    let uploadedFile: { url: string; public_id: string } | null = null;
    if (image) {
      console.log("Uploading image to Cloudinary...");
      const result = await uploadFileToCloudinary(image.buffer, image.originalname);
      console.log("Cloudinary result:", result);

      if (!("success" in result && result.success === false)) {
        uploadedFile = result as unknown as { url: string; public_id: string };
        console.log("Uploaded file:", uploadedFile);
      }
    }

    console.log("Checking if email already exists...");
    const checkRequest = new sql.Request(pool);
    checkRequest.input("Email", sql.NVarChar, email);
    const existingUsersResult = await checkRequest.query(
      "SELECT * FROM users WHERE email = @Email"
    );
    console.log("Existing users query result:", existingUsersResult.recordset);

    if (existingUsersResult.recordset.length > 0) {
      console.log("Email already registered");
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Inserting user into database...");
    const insertRequest = new sql.Request(pool);
    insertRequest.input("Name", sql.NVarChar, name);
    insertRequest.input("Email", sql.NVarChar, email);
    insertRequest.input("Avatar", sql.NVarChar, uploadedFile?.url ?? null);
    insertRequest.input("Password", sql.NVarChar, hashedPassword);

    const insertResult = await insertRequest.query(
      `INSERT INTO users (name, email, avatar, password)
       OUTPUT INSERTED.id AS id
       VALUES (@Name, @Email, @Avatar, @Password)`
    );
    console.log("Insert result:", insertResult.recordset);

    const userId = insertResult.recordset[0]?.id;
    if (!userId) throw new Error("User creation failed");
    console.log("New user ID:", userId);

    const otp_code = generateOTP();
    console.log("Generated OTP:", otp_code);

    console.log("Checking existing OTP...");
    const otpRequest = new sql.Request(pool);
    otpRequest.input("UserId", sql.Int, userId);
    const existingOtpResult = await otpRequest.query(
      "SELECT * FROM otp_codes WHERE user_id = @UserId"
    );
    console.log("Existing OTP query result:", existingOtpResult.recordset);

    if (existingOtpResult.recordset.length > 0) {
      console.log("Updating existing OTP...");
      const updateOtpRequest = new sql.Request(pool);
      updateOtpRequest.input("Otp", sql.NVarChar, otp_code);
      updateOtpRequest.input("UserId", sql.Int, userId);
      await updateOtpRequest.query(
        "UPDATE otp_codes SET otp_code = @Otp, verified = 0 WHERE user_id = @UserId"
      );
    } else {
      console.log("Inserting new OTP...");
      const insertOtpRequest = new sql.Request(pool);
      insertOtpRequest.input("UserId", sql.Int, userId);
      insertOtpRequest.input("Otp", sql.NVarChar, otp_code);
      await insertOtpRequest.query(
        "INSERT INTO otp_codes (user_id, otp_code, verified) VALUES (@UserId, @Otp, 0)"
      );
    }

    console.log("Calling sendOTPToEmail...");
    const otpResult = await sendOTPToEmail(email, otp_code);
    console.log("sendOTPToEmail result:", otpResult);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Check your email for OTP.",
    });
  } catch (error: any) {
    console.error("registerUser error:", error);
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

    await poolConnect;

    const checkRequest = new sql.Request(pool);
    checkRequest.input("Email", NVarChar, email);
    const checkResult = await checkRequest.query(
      "SELECT * FROM users WHERE email= @Email"
    );

    if (checkResult.recordset.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const user = checkResult.recordset[0];
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

  await poolConnect;

  const checkRequest = new sql.Request(pool);
  checkRequest.input("Email", NVarChar, email);

  try {
    const query = `
      SELECT u.id as user_id, u.email, o.otp_code, o.verified
      FROM users u
      JOIN otp_codes o ON u.id = o.user_id
      WHERE u.email = @Email
    `;
    const checkResult = await checkRequest.query(query);

    if (checkResult.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No OTP found for this email" });
    }

    const otp_record = checkResult.recordset[0];
    if (otp_record.verified) {
      return res
        .status(400)
        .json({ success: false, message: "Account already verified" });
    }

    if (otp_record.otp_code !== code) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    const insertRequest = new sql.Request(pool);
    insertRequest.input("UserId", Int, otp_record.user_id);
    await insertRequest.query(
      "UPDATE otp_codes SET verified = 1 WHERE user_id = @UserId"
    );

    const getRequest = new sql.Request(pool);
    getRequest.input("Id", Int, otp_record.user_id);
    const getResult = await getRequest.query(
      "SELECT * FROM users WHERE id = @Id"
    );

    const user = getResult.recordset[0];
    const token = await create_jwt(user);

    return res.json({ message: "Account verified successfully!", token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
