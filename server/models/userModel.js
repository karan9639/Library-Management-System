import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    accountVerified: {
      type: Boolean,
      default: false,
    },
    borrowedBooks: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Borrow",
        },
        returned: {
          type: Boolean,
          default: false,
        },
        bookTitle: String,
        borrowDate: Date,
        dueDate: Date,
      },
    ],
    avatar: {
      public_id: String,
      url: String,
    },
    verificationCode: Number,
    verificationCodeExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);


userSchema.methods.generateVerificationCode = function () {
  function generateRandomFourDigitNumber() {
    const firstDigit = Math.floor(Math.random() * 9) + 1; // Ensure first digit is not zero
    const otherDigits = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10));
    return parseInt(firstDigit.toString() + otherDigits.join(''), 10);
  }
  const verificationCode = generateRandomFourDigitNumber();
  this.verificationCode = verificationCode;
  this.verificationCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now
  return verificationCode;
}

export const User = mongoose.model("User", userSchema);
