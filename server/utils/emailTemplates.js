export const emailTemplates = (verificationCode) => {
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; margin-top: 0; text-align: center;">
                    Your Verification Code
                </h2>
                
                <p style="color: #666; text-align: center;">
                    Thank you for registering with us. Please use the following verification code to complete your registration:
                </p>
                
                <div style="background-color: #007BFF; color: white; font-size: 28px; font-weight: bold; padding: 20px; text-align: center; border-radius: 6px; letter-spacing: 2px; margin: 30px 0;">
                    ${verificationCode}
                </div>
                
                <p style="color: #999; font-size: 14px; text-align: center;">
                    If you did not request this code, please ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                
                <p style="color: #666; font-size: 12px; text-align: center; margin-bottom: 0;">
                    Best regards,<br /><strong>The Team</strong>
                </p>
            </div>
        </div>
    `;
};