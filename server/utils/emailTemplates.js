export function emailTemplates(verificationCode) {
  return `
        <html>
            <head>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f5f5f5;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #2e6c80 0%, #1e4d5c 100%);
                        color: #ffffff;
                        padding: 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 30px;
                    }
                    .content p {
                        color: #333333;
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 15px 0;
                    }
                    .otp-box {
                        background-color: #f0f8fa;
                        border-left: 4px solid #2e6c80;
                        padding: 20px;
                        margin: 25px 0;
                        text-align: center;
                    }
                    .otp-code {
                        font-size: 36px;
                        font-weight: bold;
                        color: #2e6c80;
                        letter-spacing: 4px;
                        font-family: 'Courier New', monospace;
                    }
                    .expiry {
                        color: #e74c3c;
                        font-weight: 600;
                        font-size: 14px;
                        margin-top: 10px;
                    }
                    .footer {
                        background-color: #f9f9f9;
                        padding: 20px;
                        text-align: center;
                        color: #666666;
                        font-size: 13px;
                        border-top: 1px solid #eeeeee;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Verify Your Email</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>Thank you for registering! Please use the verification code below to complete your registration:</p>
                        <div class="otp-box">
                            <div class="otp-code">${verificationCode}</div>
                            <div class="expiry">⏱️ Valid for 15 minutes</div>
                        </div>
                        <p>If you didn't request this code, please ignore this email.</p>
                        <p>Best regards,<br><strong>Library Management System Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Library Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
    `;
}
