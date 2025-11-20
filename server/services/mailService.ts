import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

if (!SENDGRID_API_KEY || !SENDER_EMAIL) {
  throw new Error("SENDGRID_API_KEY or SENDER_EMAIL is not defined in environment variables");
}

sgMail.setApiKey(SENDGRID_API_KEY);

export const sendOTPToEmail = async (email: string, otp: string): Promise<boolean> => {
  console.log("sendOTPToEmail started");
  console.log(`Email: ${email}, OTP: ${otp}`);

  const msg = {
    to: email,
    from: SENDER_EMAIL,
    subject: "Your OTP Code",
    text: `Use this code to verify your account: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2a9d8f;">Your OTP Code</h2>
        <p>Use the following code to verify your account:</p>
        <h1 style="color: #2a9d8f; font-size: 2rem;">${otp}</h1>
      </div>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log("OTP sent successfully:", response[0].statusCode, response[0].headers);
    return true;
  } catch (err: any) {
    console.error("Email sending error:", err.response?.body || err.message || err);
    return false;
  }
};
