import express from "express";
import { getSearchUsers, getUser, getUserConv } from "../controllers/userController";

const router = express.Router();

router.post('/fetchUsers',getUserConv);
router.get('/getUser',getUser);
router.post('/getSearchUsers',getSearchUsers);

export default router;