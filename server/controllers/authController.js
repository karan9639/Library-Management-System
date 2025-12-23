import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";

export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }

  // Find by email (verified OR not)
  let user = await User.findOne({ email });

  // If already verified, block
  if (user && user.accountVerified) {
    return next(new ErrorHandler("User already exists", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // If user exists but not verified, reuse and resend OTP
  if (user && !user.accountVerified) {
    user.name = name;
    user.password = hashedPassword;

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    user.verificationCode = verificationCode; // ✅ Number
    user.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({ validateBeforeSave: false });
    return await sendVerificationCode(verificationCode, email, res);
  }

  // If user does not exist, create new
  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const verificationCode = Math.floor(100000 + Math.random() * 900000);
  user.verificationCode = verificationCode; // ✅ Number
  user.verificationCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

  await user.save({ validateBeforeSave: false });
  return await sendVerificationCode(verificationCode, email, res);
});

export const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return next(new ErrorHandler("Please provide email and OTP", 400));
  }

  const user = await User.findOne({ email, accountVerified: false });

  if (!user) {
    return next(new ErrorHandler("User not found or already verified", 404));
  }

  // ✅ Compare as number
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
