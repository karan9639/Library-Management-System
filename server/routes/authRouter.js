import express from "express";
import { logoutUser, registerUser } from "../controllers/authController.js";
import { verifyOtp } from "../controllers/authController.js";
import { loginUser } from "../controllers/authController.js";
import { preventLoginIfAuthenticated, preventLogoutIfAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", preventLoginIfAuthenticated, loginUser);
router.get("/logout", preventLogoutIfAuthenticated, logoutUser);

export default router;