import nodemailer from "nodemailer";

// 1. Create reusable transporter (only once)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // your Gmail App Password
  },
});

export const sendEmail = async ({ from, to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(" Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error(" Error sending email:", error);
    throw error;
  }
};
