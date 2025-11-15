import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { profile, getMyEnrollments } from '../controllers/studentController.js';
import { LiveSession } from '../models/LiveSessions.js';
import { Enrollment } from '../models/Enrollment.js';

const router = express.Router();

// ✅ All student routes are protected
router.use(protect, authorize('student'));

// ✅ Get Student Profile
router.get('/profile', profile);

// ✅ Get All Enrollments
router.get('/enrollments', getMyEnrollments);

// ⭐ Get Live Sessions for Student
router.get("/live-sessions", async (req, res) => {
  try {
    const enrolledCourses = await Enrollment.find({ user: req.user._id }).select("course");
    const courseIds = enrolledCourses.map((e) => e.course);

    const sessions = await LiveSession.find({
      course: { $in: courseIds },
      $or: [
        { expiresAt: { $gte: new Date() } },
        { expiresAt: { $exists: false } },
      ],
    })
      .populate("course", "title")
      .sort({ date: 1 });

    res.json(sessions);
  } catch (err) {
    console.error("Error fetching filtered sessions:", err);
    res.status(500).json({ message: "Server error fetching live sessions" });
  }
});

// ⭐ Add this route — REQUIRED for LiveSession.jsx
router.get("/live-sessions/status/:id", async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).select("status");

    if (!session) {
      return res.status(404).json({ status: "unknown" });
    }

    return res.json({ status: session.status });
  } catch (err) {
    console.error("Error fetching session status:", err);
    return res.status(500).json({ status: "unknown" });
  }
});

export default router;
