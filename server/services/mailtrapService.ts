import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";
import dotenv from "dotenv"

dotenv.config();


export const sendOTPToEmail = async (email: string, otp: string) => {
  

const TOKEN = process.env.MAILTRAP_TOKEN;

if (!TOKEN) throw new Error("MAILTRAP_TOKEN is not defined");

const transport = nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  })
);

const sender = {
  address: "jordanmusera@outlook.com",
  name: "ETU CHAT APP",
};

  try {
    const mailOptions = {
      from: sender,
      to: email,
      subject: "Your OTP Code",
      text: `Use this code to verify your account: ${otp}`,
      html: `
        <h2>Your OTP Code</h2>
        <p>Use the following code to verify your account:</p>
        <h1 style="color: #2a9d8f;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
      category: "OTP Verification",
    };

    const info = await transport.sendMail(mailOptions);
    console.log("OTP email sent:", info);
    return true;
  } catch (err) {
    console.error("Failed to send OTP:", err);
    return false;
  }
};
