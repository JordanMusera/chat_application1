import express from "express";
import cors from "cors";
import pool from "./config/db";
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth";
import { Server } from "socket.io";
import http from "http"

const app = express();

app.use(cors({
    origin:["http://localhost:3000","http://192.168.0.159:3000"]
}));
app.use(express.json());
app.use(cookieParser())

app.use("/auth", authRoutes);

const server = http.createServer(app);
const io = new Server(server,{
    cors:{
        origin:["http://localhost:3000","http://192.168.0.159:3000"]
    }
});

io.on("connection",(socket)=>{
    console.log("A user connected:",socket.id);

    socket.on("disconnect",()=>{
        console.log("User disconnected:",socket.id);
    })
})

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
