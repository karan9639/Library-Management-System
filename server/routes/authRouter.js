import express from "express";
import {
  getUserProfile,
  logoutUser,
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import {
  isAuthenticatedUser,
  preventLoginIfAuthenticated,
  preventLogoutIfAuthenticated,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);

router.post("/login", preventLoginIfAuthenticated, loginUser);
router.get("/logout", preventLogoutIfAuthenticated, logoutUser);

// ✅ IMPORTANT: add isAuthenticatedUser here
router.get("/me", isAuthenticatedUser, getUserProfile);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);

export default router;
