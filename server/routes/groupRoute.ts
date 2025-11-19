import express from "express"
import multer from "multer"
import { createGroup } from "../controllers/groupController";

const router = express.Router();
const upload = multer();

router.post("/create_group",upload.single("avatar"),createGroup);

export default router;