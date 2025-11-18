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
  deleteStudent,
  createStudent,
  updateStudent,
  getAdminById,
} from "../controllers/adminController.js";
import { 
  listAdmins, 
  addAdmin, 
  updateAdminStatus, 
  removeAdmin,
  getAdminWithPermissions,
} from "../controllers/adminManagement.controller.js";
import { 
  getMyProfile, 
  updateProfile, 
  removeProfileImage, 
  updatePassword, 
} from "../controllers/adminProfile.controller.js";
import { setLiveSessionStatus } from "../controllers/liveSessions.controller.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { LiveSession } from "../models/LiveSessions.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { endLiveSession, getLiveSessionStatus, startLiveSession } from "../controllers/liveSessions.controller.js";

const router = express.Router();

/* ============================================================
   ⚙️ Multer File Upload Configuration
============================================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});
// Students do NOT need admin auth
router.get(
  "/live-sessions/status/:id",
  asyncHandler(async (req, res) => {
    try {
      const session = await LiveSession.findById(req.params.id).select("status");
      
      if (!session) {
        return res.status(404).json({ status: "unknown" });
      }

      return res.json({ status: session.status });
    } catch (err) {
      return res.status(500).json({ status: "unknown" });
    }
  })
);

/* ============================================================
   🔒 Admin Authentication Middleware
============================================================ */
router.use(
  protect,
  authorize("admin", "super-admin")   // any role can access all admin pages
);

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

// ✅ Update student details
router.put(
  "/students/:id",
  upload.single("profilePhoto"),
  asyncHandler(updateStudent)
);

// ✅ Add student and auto-enroll in a course (with welcome email)
router.post(
  "/students",
  upload.single("profilePhoto"),
  asyncHandler(createStudent)
);

// ✅ Get latest student ID
router.get(
  "/students/latest-id",
  asyncHandler(async (_, res) => {
    try {
      const lastStudent = await User.findOne({ role: "student" })
        .sort({ createdAt: -1 })
        .select("studentId");

      const defaultBase = 202500; // Our starting point
      let nextNumber = defaultBase + 1; // First student gets 202501
      
      // Only try to find a higher number if we have existing students
      if (lastStudent?.studentId) {
        const match = lastStudent.studentId.match(/\d+$/);
        if (match) {
          const lastNumber = parseInt(match[0], 10);
          nextNumber = Math.max(lastNumber + 1, defaultBase + 1);
        }
      }
      
      const lastId = `GACSTD${String(nextNumber).padStart(6, "0")}`;
      res.json({ lastId });
    } catch (error) {
      console.error("❌ Error fetching latest student ID:", error);
      res.status(500).json({ message: "Failed to fetch latest student ID" });
    }
  })
);

// ✅ Get single student with full details + enrolled courses
router.get(
  "/students/:id",
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.params.id)
      .select(
        "name email phone studentId status dob avatar aadharNumber gender paymentStatus course enrolledCourses createdAt"
      )
      .populate({
        path: "enrolledCourses",
        select: "title category difficulty thumbnail",
      });

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    // Load single enrollment (main course)
    const enrollment = await Enrollment.findOne({ user: student._id })
      .populate("course", "title category difficulty thumbnail")
      .lean();

    res.json({
      ...student.toObject(),
      course: enrollment?.course || null,
    });
  })
);

router.delete("/students/:id", asyncHandler(deleteStudent));
/* ============================================================
   👑 ADMIN MANAGEMENT
============================================================ */

// Admin management routes
router.route('/manage-admins')
  .get(protect, authorize('super-admin'), listAdmins)
  .post(protect, authorize('super-admin'), upload.single('profilePhoto'), addAdmin);

router.route('/manage-admins/:id')
  .get(protect, getAdminWithPermissions)
  .put(protect, authorize('super-admin'), updateAdminStatus)
  .delete(protect, authorize('super-admin'), removeAdmin);

// Admin profile routes
router.get('/profile', protect, asyncHandler(getMyProfile));
router.put(
  '/auth/update-profile', 
  protect, 
  upload.single('profilePhoto'),
  asyncHandler(updateProfile)
);
router.delete(
  '/auth/remove-profile-image', 
  protect, 
  asyncHandler(removeProfileImage)
);
router.put(
  '/auth/update-password', 
  protect, 
  [
    body('currentPassword', 'Current password is required').notEmpty(),
    body('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 }),
    body('confirmPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.newPassword)
  ],
  asyncHandler(updatePassword)
);

// ✅ Get latest admin ID
router.get("/admins/latest-id", protect, authorize("admin"), async (req, res) => {
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
// Create a live session
router.post(
  "/live-sessions",
  asyncHandler(async (req, res) => {
    const { course, title, link, date } = req.body;

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
      status: "upcoming",
      createdBy: req.user._id,
    });

    res.status(201).json(session);
  })
);

// Start + End
router.post("/live-sessions/start/:id", asyncHandler(startLiveSession));
router.post("/live-sessions/end/:id", asyncHandler(endLiveSession));

//Update a live session
router.post("/live-sessions/status/:id", protect, authorize("admin"), setLiveSessionStatus);

// List all sessions
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

// Delete
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