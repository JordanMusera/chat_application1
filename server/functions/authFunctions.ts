import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import nodemailer from "nodemailer";
import { MailtrapTransport } from "mailtrap";

dotenv.config();

export const create_jwt = (user:any)=>{
    const token = jwt.sign(
        {id:user.id, email:user.email, name:user.name},
        process.env.JWT_SECRET as string,
        {expiresIn:"1h"}
    )
    return token;
}

export const verifyToken = (token:any)=>{
    if(!token) return {authorized:false}
    const decoded = jwt.verify(token,process.env.JWT_SECRET as string) as {
        id:number,
        email:string,
        name:string
    }
    return {authorized:false,id:decoded.id,email:decoded.email,name:decoded.name}
}

export const generateOTP=():string=>{
    const code = Math.floor(10000 + Math.random()*90000);
    return code.toString();
}

export const sendOTPToEmail = async (email: string, otp: string) => {
  

const TOKEN = process.env.MAILTRAP_TOKEN;

if (!TOKEN) throw new Error("MAILTRAP_TOKEN is not defined");

const transport = nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
  })
);

const sender = {
  address: "hello@demomailtrap.co",
  name: "Mailtrap Test",
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
