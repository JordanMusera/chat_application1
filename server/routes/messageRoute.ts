import express from "express";
import { getMessagesByChatId } from "../controllers/messageController";

const router = express.Router();

router.post("/getMessages",getMessagesByChatId);

export default router;