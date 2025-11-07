import express from 'express';
import { body } from 'express-validator';
import { authorize, protect } from '../middlewares/auth.js';
import {
  listStudents,
  updateStudentStatus,
  analytics,
} from '../controllers/adminController.js';
import multer from 'multer';
import path from 'path';
import { handleUpload } from '../controllers/uploadController.js';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js'; 
import { LiveSession } from "../models/LiveSessions.js";
import { asyncHandler } from '../utils/asyncHandler.js';


const router = express.Router();

router.use(protect, authorize('admin'));

/* -----------------------------------
   ✅ 1. STUDENT MANAGEMENT
----------------------------------- */
router.get('/students', listStudents);

router.patch(
  '/students/:id/status',
  [body('status').isIn(['active', 'banned'])],
  updateStudentStatus
);

/* -----------------------------------
   ✅ 2. CREATE STUDENT + AUTO ENROLL
----------------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.post('/students', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, phone, course, dob, studentId, password } = req.body;

    console.log("📥 Incoming Student Data:", req.body);

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already exists' });

    // ✅ Find course by ID now
    const selectedCourse = await Course.findById(course);
    if (!selectedCourse)
      return res.status(404).json({ message: 'Selected course not found' });

    // ✅ Create student
    const newUser = new User({
      name,
      email,
      phone,
      dob,
      studentId,
      password,
      role: 'student',
      status: 'active',
      avatar: req.file ? `/uploads/${req.file.filename}` : '',
    });

    await newUser.save();
    console.log("✅ Student Created:", newUser._id);

    // ✅ Create Enrollment
    const newEnrollment = new Enrollment({
      user: newUser._id,
      course: selectedCourse._id,
      completedContentIds: [],
    });

    await newEnrollment.save();
    console.log("✅ Enrollment Created:", newEnrollment._id);

    return res.status(201).json({
      message: 'Student added and enrolled successfully!',
      student: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        studentId: newUser.studentId,
        course: selectedCourse.title,
      },
    });
  } catch (error) {
    console.error("❌ Error creating student:", error);
    return res.status(500).json({ message: 'Server error while creating student' });
  }
});
/* -----------------------------------
   ✅ 3. STUDENT ID GENERATION
----------------------------------- */
router.get('/students/latest-id', async (req, res) => {
  try {
    const lastStudent = await User.findOne({ role: 'student' })
      .sort({ createdAt: -1 })
      .select('studentId');

    const lastId = lastStudent?.studentId || 'GAC123000';
    return res.json({ lastId });
  } catch (error) {
    console.error('Error fetching latest student ID:', error);
    return res
      .status(500)
      .json({ message: 'Server error fetching latest student ID' });
  }
});

/* -----------------------------------
   ✅ 4. FETCH COURSES FOR DROPDOWN
----------------------------------- */
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ published: true })
      .select('_id title category difficulty')
      .sort({ title: 1 });

    // ✅ Include _id for dropdown value
    const formatted = courses.map((c) => ({
      _id: c._id,
      name: c.title,
      category: c.category,
      difficulty: c.difficulty,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Server error fetching courses' });
  }
});


/* -----------------------------------
   ✅ 5. ANALYTICS
----------------------------------- */
router.get('/analytics', analytics);

/* -----------------------------------
   ✅ 6. FILE UPLOAD (VIDEOS/PDFS)
----------------------------------- */
router.post('/upload', upload.single('file'), handleUpload);

// POST /api/admin/live-sessions
router.post('/live-sessions', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { course, title, link, date } = req.body;

  console.log("📥 Incoming Live Session Data:", req.body);

  if (!course || !title || !link || !date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // validate course
  const selectedCourse = await Course.findById(course);
  if (!selectedCourse) {
    return res.status(404).json({ message: "Invalid course selected" });
  }

  const newSession = await LiveSession.create({
    course,
    title,
    link,
    date,
    createdBy: req.user._id,
  });

  console.log("✅ Session Saved:", newSession);
  res.status(201).json(newSession);
}));

// ✅ Get all sessions with course info
router.get("/live-sessions", protect, authorize("admin"), async (req, res) => {
  const sessions = await LiveSession.find().populate("course", "title category difficulty");
  res.json(sessions);
});

// ✅ Delete session
router.delete("/live-sessions/:id", protect, authorize("admin"), async (req, res) => {
  await LiveSession.findByIdAndDelete(req.params.id);
  res.json({ message: "Live session deleted successfully" });
});


export default router;
