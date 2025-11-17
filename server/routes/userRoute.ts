import express from "express";
import { getSearchUsers, getUser, getUserConv } from "../controllers/userController";
import { verifyAccount } from "../controllers/authController";

const router = express.Router();

router.post('/fetchUsers',getUserConv);
router.get('/getUser',getUser);
router.post('/getSearchUsers',getSearchUsers);
router.post('/verifyAccount',verifyAccount)

export default router;