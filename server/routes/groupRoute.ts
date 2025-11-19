import express from "express"
import multer from "multer"
import { createGroup, fetchGroups } from "../controllers/groupController";

const router = express.Router();
const upload = multer();

router.post("/create_group",upload.single("avatar"),createGroup);
router.get("/fetch_groups",fetchGroups);

export default router;