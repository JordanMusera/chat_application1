import express from "express"
import { registerUser, signInUser, verifyUser } from "../controllers/authController"

const router = express.Router();

router.post('/register',registerUser);
router.post('/signin',signInUser);
router.get('/verify',verifyUser);

export default router;