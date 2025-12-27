import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Helpers
 */
const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const requiredTrimmed = (v) => typeof v === "string" && v.trim().length > 0;

const validPassword = (pwd) => typeof pwd === "string" && pwd.length >= 6; // adjust rules if you want

/**
 * POST /register
 */
export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const name = req.body?.name?.trim();
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (
    !requiredTrimmed(name) ||
    !requiredTrimmed(email) ||
    !requiredTrimmed(password)
  ) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  if (!validPassword(password)) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400)
    );
  }

  let user = await User.findOne({ email });

  // If already verified, block
  if (user?.accountVerified) {
    return next(new ErrorHandler("User already exists", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate secure OTP
  const verificationCode = crypto.randomInt(100000, 1000000); // 6-digit
  const verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

  // If user exists but not verified, update and resend OTP
  if (user && !user.accountVerified) {
    user.name = name;
    user.password = hashedPassword;
    user.verificationCode = verificationCode;
    user.verificationCodeExpire = verificationCodeExpire;

    await user.save({ validateBeforeSave: false });
    return sendVerificationCode(verificationCode, email, res);
  }

  // Create new unverified user
  user = await User.create({
    name,
    email,
    password: hashedPassword,
    verificationCode,
    verificationCodeExpire,
    accountVerified: false,
  });

  return sendVerificationCode(verificationCode, email, res);
});

/**
 * POST /verify-otp
 */
export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  const otp = req.body?.otp;

  if (!requiredTrimmed(email) || otp === undefined || otp === null) {
    return next(new ErrorHandler("Please provide email and OTP", 400));
  }

  const user = await User.findOne({ email, accountVerified: false });

  if (!user) {
    return next(new ErrorHandler("User not found or already verified", 404));
  }

  if (user.verificationCode !== Number(otp)) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }

  if (
    !user.verificationCodeExpire ||
    Date.now() > user.verificationCodeExpire.getTime()
  ) {
    return next(new ErrorHandler("OTP has expired", 400));
  }

  user.accountVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpire = null;

  await user.save({ validateModifiedOnly: true });

  return sendToken(user, 200, "Account verified successfully", res);
});

/**
 * POST /login
 */
export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!requiredTrimmed(email) || !requiredTrimmed(password)) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );

  if (!user) {
    return next(new ErrorHandler("Invalid email or account not verified", 401));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid password", 401));
  }

  return sendToken(user, 200, "Login successful", res);
});

/**
 * POST /logout
 */
export const logoutUser = catchAsyncErrors(async (req, res) => {
  return res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

/**
 * GET /me
 */
export const getUserProfile = catchAsyncErrors(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /password/forgot
 * Security: respond with success even if user doesn't exist (avoid email enumeration)
 */
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const email = normalizeEmail(req.body?.email);

  if (!requiredTrimmed(email)) {
    return next(new ErrorHandler("Please provide email", 400));
  }

  const user = await User.findOne({ email, accountVerified: true });

  // Always respond success (do not reveal if user exists)
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const html = generateForgotPasswordEmailTemplate(user.name, resetPasswordUrl);

  try {
    await sendEmail({
      to: user.email,
      subject: "Library Management System - Password Recovery",
      html,
    });

    return res.status(200).json({
      success: true,
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

/**
 * PUT /password/reset/:token
 */
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  const password = req.body?.password;
  const confirmPassword = req.body?.confirmPassword;

  if (!requiredTrimmed(password) || !requiredTrimmed(confirmPassword)) {
    return next(
      new ErrorHandler("Please provide password and confirmPassword", 400)
    );
  }

  if (!validPassword(password)) {
    return next(
      new ErrorHandler("Password must be at least 6 characters", 400)
    );
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Reset token is invalid or has expired", 400));
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return sendToken(user, 200, "Password reset successful", res);
});

/**
 * PUT /password/update
 */
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body || {};

  if (
    !requiredTrimmed(oldPassword) ||
    !requiredTrimmed(newPassword) ||
    !requiredTrimmed(confirmNewPassword)
  ) {
    return next(new ErrorHandler("Please provide all required fields", 400));
  }

  if (!validPassword(newPassword)) {
    return next(
      new ErrorHandler("New password must be at least 6 characters", 400)
    );
  }

  if (newPassword !== confirmNewPassword) {
    return next(
      new ErrorHandler("New password and confirm password do not match", 400)
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) return next(new ErrorHandler("User not found", 404));

  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return sendToken(user, 200, "Password updated successfully", res);
});
