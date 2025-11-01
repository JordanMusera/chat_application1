import express from "express";
import cors from "cors";
import pool from "./config/db";
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth";

const app = express();

app.use(cors({
    origin:["http://localhost:3000","http://192.168.0.159:5173"],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser())

app.use("/auth", authRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
