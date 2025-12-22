import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const registerUser = catchAsyncErrors(async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }
        const existingUser = await User.findOne({ email , accountVerified: true });
        if (existingUser) {
            return next(new ErrorHandler("User already exists", 400));
        }
        const registrationAttemptsByUser = await User.findOne({ email , accountVerified: false});
        if (registrationAttemptsByUser > 5) {
            return next(new ErrorHandler("Too many registration attempts. Please try again later.", 429));
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        })
        const verificationCode = await user.generateVerificationCode(); 
        await user.save({ validateBeforeSave: false });
        sendVerificationCode(verificationCode, email, res);
    } catch (error) {
        next(error);
    }

});