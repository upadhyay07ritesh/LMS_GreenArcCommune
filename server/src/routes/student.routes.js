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

// ✅ Get All Enrollments (manual + admin-assigned)
router.get('/enrollments', getMyEnrollments);

// GET /api/student/live-sessions
router.get("/live-sessions", protect, authorize("student"), async (req, res) => {
  try {
    // Find all courses this student is enrolled in
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
export default router;
