import schedule from "node-schedule";
import nodemailer from "nodemailer";
import { User } from "../models/User.js";
import { LiveSession } from "../models/LiveSessions.js";
import { generateReminderEmail } from "./email.js";

export function scheduleEmailReminder(session) {
  try {
    const sessionTime = new Date(session.date);

    // 30 minutes before
    const reminderTime = new Date(sessionTime.getTime() - 30 * 60 * 1000);

    if (reminderTime < new Date()) {
      console.log("⏳ Reminder time already passed for:", session.title);
      return;
    }

    console.log(`📅 Reminder scheduled at ${reminderTime} for session: ${session.title}`);

    schedule.scheduleJob(`session_${session._id}`, reminderTime, async () => {
      try {
        console.log("📧 Sending reminder emails for session:", session.title);

        const students = await User.find({ role: "student" }).select("email name");

        if (!students.length) {
          console.log("⚠ No student records found.");
          return;
        }

        // SMTP Transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const minutesLeft = Math.round(
          (new Date(session.date) - new Date()) / 60000
        );

        // Send email **IN DIVIDED MESSAGES** to avoid spam or block
        for (const student of students) {
          const name = student.name || "Student";

          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: student.email,
            subject: `Reminder: ${session.title} starts in ${minutesLeft} minutes`,
            html: generateReminderEmail(name, session, minutesLeft),
          });

          console.log(`📨 Sent to: ${student.email}`);
        }

        // Mark session email sent
        await LiveSession.findByIdAndUpdate(session._id, {
          emailReminderSent: true,
        });

        console.log("✅ Reminder emails completed for:", session.title);

      } catch (err) {
        console.error("❌ Email Send Error:", err);
      }
    });

  } catch (err) {
    console.error("❌ Scheduler Error:", err);
  }
}

export async function scheduleAllUpcomingSessions() {
  try {
    console.log("⏳ Checking all unsent upcoming reminder sessions...");

    const upcoming = await LiveSession.find({
      date: { $gte: new Date() },
      emailReminderSent: false,
    });

    upcoming.forEach((session) => scheduleEmailReminder(session));

    console.log(`📌 Scheduled ${upcoming.length} pending reminders.`);
  } catch (err) {
    console.error("❌ Scheduler Load Error:", err);
  }
}
