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

export function generateForgotPasswordEmailTemplate(name, resetPasswordUrl) {
  const year = new Date().getFullYear();

  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Password Reset</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Segoe UI, Tahoma, Geneva, Verdana, sans-serif;">
      
      <!-- Full width wrapper -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f5; padding:20px 0;">
        <tr>
          <td align="center" style="padding:0 12px;">
            
            <!-- Card -->
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
              style="width:600px; max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background:#1e4d5c; background-image:linear-gradient(135deg,#2e6c80 0%,#1e4d5c 100%); padding:26px 20px; text-align:center;">
                  <div style="color:#ffffff; font-size:28px; font-weight:700; line-height:1.2;">
                    Password Reset Request
                  </div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding:28px 26px;">
                  <p style="margin:0 0 14px; color:#333333; font-size:16px; line-height:1.6;">
                    Hello ${name},
                  </p>
                  <p style="margin:0 0 18px; color:#333333; font-size:16px; line-height:1.6;">
                    We received a request to reset your password. Click the button below to proceed:
                  </p>

                  <!-- Button -->
                  <div style="text-align:center; margin:22px 0 18px;">
                    <a href="${resetPasswordUrl}"
                      style="
                        display:inline-block;
                        background-color:#2e6c80;
                        border:1px solid #2e6c80;
                        padding:12px 18px;
                        border-radius:6px;
                        text-decoration:none;
                        font-weight:700;
                        font-size:16px;
                        line-height:1;
                        color:#ffffff !important;
                        -webkit-text-size-adjust:none;
                      "
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reset Password
                    </a>
                  </div>

                  <p style="margin:0 0 16px; color:#333333; font-size:16px; line-height:1.6;">
                    If you didn't request this change, please ignore this email.
                  </p>

                  <p style="margin:0; color:#333333; font-size:16px; line-height:1.6;">
                    Best regards,<br />
                    <strong>Library Management System Team</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9f9f9; padding:18px 16px; text-align:center; border-top:1px solid #eeeeee;">
                  <p style="margin:0; color:#666666; font-size:13px; line-height:1.4;">
                    © ${year} Library Management System. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
            <!-- /Card -->

          </td>
        </tr>
      </table>
      <!-- /Wrapper -->

    </body>
  </html>
  `;
}

