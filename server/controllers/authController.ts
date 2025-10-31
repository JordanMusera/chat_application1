import { Request,Response } from "express";
import db from "../config/db";
import bcrypt from "bcrypt"
import { create_jwt } from "../functions/authFunctions";

export const registerUser = async(req:Request,res:Response)=>{
    try {
        const {name,email,password} = req.body;
        if(!name||!email||!password){
            return res.status(400).json({message:"All fields are required"})
        }

        const [existing] = await db.query("SELECT * FROM users WHERE email = ?",[email]);
        if((existing as any).length>0)
            return res.status(400).json({message:"Email already registered"});

        const hashedPassword = await bcrypt.hash(password,10);

        await db.query("INSERT INTO users (name,email,password) VALUES (?,?,?)",[
            name,
            email,
            hashedPassword
        ]);

        res.status(201).json({message:"User registered successfully"});
    } catch (error:any) {
        res.status(500).json({message:error.message})
    }
}

export const signInUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

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

            res.cookie("token",token,{
                httpOnly:true,
                secure:process.env.NODE_ENV === "production",
                maxAge:60*60*1000
            });
            
            return res.status(200).json({message:"Login successful",token})
        } else {
            return res.status(400).json({ message: "Password is invalid" });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
