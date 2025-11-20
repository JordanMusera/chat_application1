import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendOTPToEmail = async (email: string, otp: string) => {
  try {
    const transport = nodemailer.createTransport({
      secure:true,
      host:'smtp.gmail.com',
      port:465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"ETU CHAT APP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Use this code to verify your account: ${otp}`,
      html: `
        <h2>Your OTP Code</h2>
        <p>Use the following code to verify your account:</p>
        <h1 style="color: #2a9d8f;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      `,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("OTP sent:", info.messageId);
    return true;

  } catch (err) {
    console.error("Email sending error:", err);
    return false;
  }
};
