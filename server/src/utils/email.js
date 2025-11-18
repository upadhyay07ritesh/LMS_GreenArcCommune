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

export function generateReminderEmail(name, session, minutesLeft) {
  const lmsUrl = process.env.LMS_URL || "https://lms.greenarccommune.com/dashboard";
  const formattedDate = new Date(session.date).toLocaleString("en-IN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    day: "numeric",
  });

  return `
<div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 700px; margin: auto; background: #ffffff; padding: 20px;">
  
  <!-- HEADER -->
  <div style="text-align: center; padding: 20px 0;">
    <img src="http://192.168.1.68:5000/assets/GreenArcLogo.png" style="height: 70px;" />
    <h1 style="color: #14532d; font-size: 24px; margin-top: 10px;">Session Reminder</h1>
  </div>

  <!-- GREETING -->
  <p style="font-size: 16px; color: #111827;">
    Dear <strong>${name}</strong>,
  </p>

  <!-- MAIN MESSAGE -->
  <p style="font-size: 15px; color: #374151; line-height: 1.6;">
    Your upcoming session <strong style="color:#166534;">"${session.title}"</strong>
    is scheduled for <strong>${formattedDate}</strong> and will begin in
    <strong>${minutesLeft} minutes</strong>.
  </p>

  <!-- LMS BUTTON -->
  <div style="text-align: center; margin: 25px 0;">
    <a href="${lmsUrl}"
       style="background-color: #166534; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
      Go to LMS to Join Session
    </a>
  </div>

  <p style="font-size: 14px; color: #6b7280;">
    A “Join Session” button will appear inside your LMS dashboard once the mentor starts the live session.
  </p>

  <hr style="margin:30px 0;" />

  <!-- FOOTER -->
  <p style="font-size: 14px; color: #111827;">
    Warm regards,<br>
    <strong>Team Green Arc Commune</strong><br />
    support@greenarccommune.com<br>
    Instagram: <a href="https://www.instagram.com/greenarccommune/">@greenarccommune</a><br />
    YouTube: <a href="https://www.youtube.com/@GreenArcCommune">GreenArc Commune</a><br />
    Wealth | Wisdom | Wellness
  </p>

</div>
  `;
}
