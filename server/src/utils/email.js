import { Resend } from "resend";
import nodemailer from "nodemailer";

const resend = new Resend(process.env.RESEND_API_KEY);

/* ============================================================
   ✅ Send Email (Resend + Fallback)
============================================================ */
export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.RESEND_FROM || "GreenArc LMS <upadhyay07ritesh@gmail.com>";

  console.log("🚀 Attempting to send email via:", from);

  try {
    if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (response?.error) throw new Error(response.error.message);

    console.log("✅ Email sent via Resend:", response.data?.id || "(no ID)");
    return response.data;
  } catch (err) {
    console.error("❌ Resend failed:", err.message);

    console.log("🟡 Falling back to Nodemailer (Ethereal test mode)...");
    return await sendEmailFallback({ to, subject, html, text });
  }
}

/* ============================================================
   🧰 Fallback: Nodemailer (Ethereal)
============================================================ */
async function sendEmailFallback({ to, subject, html, text }) {
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: testAccount.auth,
    });

    const info = await transporter.sendMail({
      from: '"GreenArc LMS (Dev Fallback)" <no-reply@greenarccommune.com>',
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Fallback email sent:", info.messageId);
    console.log("🔗 Preview:", nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error("❌ Fallback email failed:", error.message);
    throw error;
  }
}
