import express from "express"
import { registerUser, signInUser } from "../controllers/authController"

const router = express.Router();

router.post('/register',registerUser);
router.get('/signin',signInUser);

export default router;