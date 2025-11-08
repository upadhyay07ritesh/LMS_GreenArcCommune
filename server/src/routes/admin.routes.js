// server/src/routes/admin.routes.js
import express from "express";
import path from "path";
import multer from "multer";
import { body } from "express-validator";
import { fileURLToPath } from "url";
import fs from "fs";

import { protect, authorize } from "../middlewares/auth.js";
import { handleUpload } from "../controllers/uploadController.js";
import {
  listStudents,
  updateStudentStatus,
  analytics,
  getAdminById,
  getLatestAdminId,
  deleteStudent,
} from "../controllers/adminController.js";
import {
  listAdmins,
  addAdmin,
  updateAdminStatus,
  removeAdmin,
} from "../controllers/adminManagement.controller.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { LiveSession } from "../models/LiveSessions.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

/* ============================================================
   ⚙️ Multer File Upload Configuration
============================================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

/* ============================================================
   🔒 Admin Authentication Middleware
============================================================ */
router.use(protect, authorize("admin"));

/* ============================================================
   🎓 STUDENT MANAGEMENT
============================================================ */

// ✅ List all students
router.get("/students", asyncHandler(listStudents));

// ✅ Update student status
router.patch(
  "/students/:id/status",
  [body("status").isIn(["active", "banned"])],
  asyncHandler(updateStudentStatus)
);

// ✅ Add student and auto-enroll in a course
router.post(
  "/students",
  upload.single("profilePhoto"),
  asyncHandler(async (req, res) => {
    const { name, email, phone, course, dob, studentId, password } = req.body;
    console.log("📥 Incoming Student Data:", req.body);

    // Duplicate email check
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Verify course validity
    const selectedCourse = await Course.findById(course);
    if (!selectedCourse)
      return res.status(404).json({ message: "Selected course not found" });

    // Create student
    const newUser = await User.create({
      name,
      email,
      phone,
      dob,
      studentId,
      password,
      role: "student",
      status: "active",
      avatar: req.file ? `/uploads/${req.file.filename}` : "",
    });

    // Create enrollment
    await Enrollment.create({
      user: newUser._id,
      course: selectedCourse._id,
      completedContentIds: [],
    });

    res.status(201).json({
      message: "Student added and enrolled successfully!",
      student: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        studentId: newUser.studentId,
        course: selectedCourse.title,
      },
    });
  })
);

// ✅ Get latest student ID
router.get(
  "/students/latest-id",
  asyncHandler(async (_, res) => {
    try {
      const lastStudent = await User.findOne({ role: "student" })
        .sort({ createdAt: -1 })
        .select("studentId");

      const lastId = lastStudent?.studentId || "GAC123000";
      res.json({ lastId });
    } catch (error) {
      console.error("❌ Error fetching latest student ID:", error);
      res.status(500).json({ message: "Failed to fetch latest student ID" });
    }
  })
);

// ✅ Get single student with enrolled courses
router.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.params.id).select(
      "name email studentId status dob avatar"
    );
    if (!student)
      return res.status(404).json({ message: "Student not found" });

    const enrollments = await Enrollment.find({ user: req.params.id }).populate(
      "course",
      "title category difficulty thumbnail"
    );

    res.json({
      ...student.toObject(),
      enrolledCourses: enrollments.map((e) => ({
        _id: e.course._id,
        title: e.course.title,
        category: e.course.category,
        difficulty: e.course.difficulty,
      })),
    });
  })
);
router.delete("/students/:id", asyncHandler(deleteStudent));
/* ============================================================
   👑 ADMIN MANAGEMENT
============================================================ */

// ✅ List all admins
router.get("/admins", protect, authorize("admin", "superadmin"), listAdmins);
// ✅ Add new admin
router.post("/admins", protect, authorize("admin", "superadmin"), upload.single("profilePhoto"), asyncHandler(addAdmin));


// ✅ Get latest admin ID
router.get("/admins/latest-id", protect, authorize("admin", "superadmin"), async (req, res) => {
  const lastAdmin = await User.findOne({ role: "admin" }).sort({ createdAt: -1 });
  let nextNumber = 1;
  if (lastAdmin?.adminId) {
    const match = lastAdmin.adminId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }
  res.json({ nextId: `GACADM${String(nextNumber).padStart(3, "0")}` });
});
// ✅ Get single admin details
router.get("/admins/:id", asyncHandler(getAdminById));

// ✅ Update admin status
router.patch("/admins/:id/status", protect, authorize("admin", "superadmin"), updateAdminStatus);


// ✅ Remove admin role
router.delete("/admins/:id", protect, authorize("admin", "superadmin"), removeAdmin);


/* ============================================================
   📚 COURSES & ANALYTICS
============================================================ */

// ✅ Get available courses (for dropdowns)
router.get(
  "/courses",
  asyncHandler(async (_, res) => {
    const courses = await Course.find({ published: true })
      .select("_id title category difficulty")
      .sort({ title: 1 });

    res.json(
      courses.map((c) => ({
        _id: c._id,
        name: c.title,
        category: c.category,
        difficulty: c.difficulty,
      }))
    );
  })
);

// ✅ Analytics dashboard data
router.get("/analytics", asyncHandler(analytics));

/* ============================================================
   🎥 LIVE SESSIONS
============================================================ */

// ✅ Create a live session
router.post(
  "/live-sessions",
  asyncHandler(async (req, res) => {
    const { course, title, link, date } = req.body;
    console.log("📥 Incoming Live Session Data:", req.body);

    if (!course || !title || !link || !date)
      return res.status(400).json({ message: "All fields are required" });

    const selectedCourse = await Course.findById(course);
    if (!selectedCourse)
      return res.status(404).json({ message: "Invalid course selected" });

    const session = await LiveSession.create({
      course,
      title,
      link,
      date,
      createdBy: req.user._id,
    });

    res.status(201).json(session);
  })
);

// ✅ Get all live sessions
router.get(
  "/live-sessions",
  asyncHandler(async (_, res) => {
    const sessions = await LiveSession.find().populate(
      "course",
      "title category difficulty"
    );
    res.json(sessions);
  })
);

// ✅ Delete a live session
router.delete(
  "/live-sessions/:id",
  asyncHandler(async (req, res) => {
    await LiveSession.findByIdAndDelete(req.params.id);
    res.json({ message: "Live session deleted successfully" });
  })
);

/* ============================================================
   📤 FILE UPLOADS (Videos / PDFs)
============================================================ */
router.post("/upload", upload.single("file"), asyncHandler(handleUpload));

export default router;
