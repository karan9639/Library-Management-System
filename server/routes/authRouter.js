import express from "express";
import {
  getUserProfile,
  logoutUser,
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/authController.js";

import {
  isAuthenticated,
  preventLoginIfAuthenticated,
  preventLogoutIfAuthenticated,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);

router.post("/login", preventLoginIfAuthenticated, loginUser);
router.get("/logout", preventLogoutIfAuthenticated, logoutUser);

// ✅ IMPORTANT: add isAuthenticated here
router.get("/me", isAuthenticated, getUserProfile);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.post("/password/update", isAuthenticated, updatePassword);

export default router;
