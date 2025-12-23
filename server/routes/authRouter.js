import express from "express";
import { registerUser } from "../controllers/authController.js";
import { verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);

export default router;