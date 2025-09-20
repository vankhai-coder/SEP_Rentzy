
export const verifyEmailTemplate = (verifyLink) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Verify Your Email</title>
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
        margin: 20px 0;
        padding: 12px 20px;
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        }
        .button:hover {
          background: #15803d;
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
        <h2>Email Verification</h2>
        <p>Hello,</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <a href="${verifyLink}" class="button">Verify Email</a>
        <p>If you didn’t create an account, you can safely ignore this email.</p>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rentzy. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `;
}

export const resetPasswordTemplate = (resetLink, username = "there") => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        background-color: #ffffff;
        max-width: 600px;
        margin: 40px auto;
        border-radius: 8px;
        padding: 20px 30px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
      h2 {
        color: #333333;
      }
      p {
        font-size: 15px;
        color: #555555;
        line-height: 1.5;
      }
      .btn {
        display: inline-block;
        margin: 20px 0;
        padding: 12px 20px;
        background-color: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
      }
      .footer {
        margin-top: 30px;
        font-size: 13px;
        color: #777777;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Hello ${username},</h2>
      <p>You recently requested to reset your password. Click the button below to reset it:</p>
      <p>
        <a class="btn" href="${resetLink}" target="_blank">Reset Password</a>
      </p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Rentzy. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

