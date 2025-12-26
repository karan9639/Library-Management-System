import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddlewares.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

// Prevent logout when already logged out
export const preventLogoutIfAuthenticated = catchAsyncErrors(
  async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
      return next(new ErrorHandler("You are already logged out", 400));
    }

    try {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decodedData.id);

      if (!req.user) {
        return next(new ErrorHandler("You are already logged out", 400));
      }

      return next();
    } catch (err) {
      return next(new ErrorHandler("You are already logged out", 400));
    }
  }
);

// Prevent login when already logged in
export const preventLoginIfAuthenticated = catchAsyncErrors(
  async (req, res, next) => {
    const { token } = req.cookies;

    // No token => allow login
    if (!token) return next();

    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return next(new ErrorHandler("You are already logged in", 400));
    } catch (err) {
      // Invalid/expired token => allow login
      return next();
    }
  }
);

export const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("User is not authenticated", 401));
  }

  let decodedData;
  try {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token", 401));
  }

  const user = await User.findById(decodedData.id);
  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }

  req.user = user;
  next();
});