import express from "express";
import { getMessagesByChatId, postMessage } from "../controllers/messageController";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post("/getMessages",getMessagesByChatId);
router.post("/postMessage",upload.single("file"),postMessage);

export default router;