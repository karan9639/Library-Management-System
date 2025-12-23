import { emailTemplates } from "./emailTemplates.js";
import { sendEmail } from "./sendEmail.js";

export const sendVerificationCode = async (verificationCode, email, res) => {
  try {
    const message = emailTemplates(verificationCode);

    await sendEmail({
      to: email,
      subject: "Your Verification Code",
      html: message, // 👈 use html (common in nodemailer)
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully.",
    });
  } catch (error) {
    console.error("SEND EMAIL FAILED:", error?.message);
    console.error(error); // full nodemailer error

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to send verification code.",
    });
  }
};
