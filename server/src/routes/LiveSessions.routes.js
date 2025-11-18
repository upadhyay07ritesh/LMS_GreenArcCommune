import express from "express";
import { LiveSession } from "../models/LiveSessions.js";
import { Course } from "../models/Course.js";

import {
  startLiveSession,
  endLiveSession,
  getLiveSessionStatus,
} from "../controllers/liveSessions.controller.js";

const router = express.Router();
const CRON_SECRET = process.env.CRON_SECRET || "myStrongSecretKey";

// 🧠 Test route
router.get("/test", (req, res) => res.send("✅ LiveSessions router active!"));

// ---------------------------------------------
// ⚡ ADD THESE ROUTES (Admin Start/End)
// ---------------------------------------------
router.post("/start/:id", startLiveSession);
router.post("/end/:id", endLiveSession);

// ---------------------------------------------
// ⚡ ADD THIS ROUTE (Student status polling)
// ---------------------------------------------
router.get("/status/:id", getLiveSessionStatus);

// ---------------------------------------------
// Existing CRON Auto-session
// ---------------------------------------------
router.post("/autosession", async (req, res) => {
  try {
    const auth = req.headers["x-cron-secret"];
    if (auth !== CRON_SECRET) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const courses = await Course.find();
    if (!courses.length) {
      return res.status(400).json({ success: false, message: "No courses found" });
    }

    const randomCourse = courses[Math.floor(Math.random() * courses.length)];

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    nextDate.setHours(17, 0, 0, 0);

    const safeCourse = randomCourse.title.replace(/\s+/g, "-");
    const randomCode = Date.now().toString(36);
    const meetLink = `https://meet.jit.si/${safeCourse}-${randomCode}`;

    const newSession = await LiveSession.create({
      course: randomCourse._id,
      title: `${randomCourse.title} — Group Live Trading Session`,
      link: meetLink,
      date: nextDate,
      createdBy: null,
    });

    console.log(`✅ Auto Live Session Created: ${newSession.title}`);
    res.status(200).json({ success: true, session: newSession });
  } catch (err) {
    console.error("❌ Error creating live session:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🧾 All sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await LiveSession.find()
      .populate("course", "title")
      .sort({ date: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🕓 Latest session
router.get("/latest", async (req, res) => {
  try {
    const latest = await LiveSession.find().sort({ createdAt: -1 }).limit(1);
    if (!latest.length) return res.status(404).json({ message: "No sessions found" });
    res.status(200).json(latest[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
