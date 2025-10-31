import express from "express";
import cors from "cors";
import pool from "./config/db";
import authRoutes from "./routes/auth";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
