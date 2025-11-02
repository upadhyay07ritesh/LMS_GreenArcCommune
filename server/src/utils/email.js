import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || `no-reply@${(process.env.APP_NAME || 'app').toLowerCase()}.local`;
  return transporter.sendMail({ from, to, subject, html, text });
}
