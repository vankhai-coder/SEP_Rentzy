// src/utils/templates/resetPasswordTemplate.js

export function resetPasswordTemplate(resetLink) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: 30px;
        }
        h2 {
          color: #333333;
        }
        p {
          color: #555555;
          font-size: 15px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background: #4f46e5;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
        .button:hover {
          background: #4338ca;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #888888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You recently requested to reset your password. Click the button below to reset it:</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `;
}
