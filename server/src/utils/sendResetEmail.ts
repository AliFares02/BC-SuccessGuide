import nodemailer from "nodemailer";
import "dotenv/config";

export default async function sendResetEmail(to: string, resetURL: string) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"BC Career Roadmap" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}
