import express from "express"
import { registerUser, signInUser, verifyAccount, verifyUser } from "../controllers/authController"
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post('/register',upload.single("image"),registerUser);
router.post('/signin',signInUser);
router.get('/verify',verifyUser);
router.post('/verifyAccount',verifyAccount);

export default router;