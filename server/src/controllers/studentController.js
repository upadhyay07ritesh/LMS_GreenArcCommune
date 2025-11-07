import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';

/* -------------------------------------------
   ✅ GET /api/student/profile
------------------------------------------- */
export const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('name email role studentId')
    .lean();

  if (!user) {
    res.status(404);
    throw new Error('Student not found');
  }

  // ✅ Get all enrollments for this student
  const enrollments = await Enrollment.find({ user: user._id })
    .populate('course', 'title category difficulty thumbnail createdAt')
    .select('course progress createdAt')
    .sort({ createdAt: -1 }) // Newest first
    .lean();

  const enrolledCourses = enrollments.map((e) => ({
    id: e._id,
    course: e.course,
    progress: e.progress || 0,
  }));

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    enrolledCourses,
  });
});

/* -------------------------------------------
   ✅ GET /api/student/enrollments
   Unified for both admin-assigned + manual
------------------------------------------- */
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1️⃣ Fetch enrollments (manual or admin-created)
  const enrollments = await Enrollment.find({ user: userId })
    .populate('course', 'title category difficulty thumbnail createdAt')
    .select('course progress createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // 2️⃣ Also handle admin-assigned courses (if added directly on User in future)
  const user = await User.findById(userId)
    .populate('enrolledCourses', 'title category difficulty thumbnail createdAt')
    .select('enrolledCourses')
    .lean();

  // 3️⃣ Merge both sources
  const combined = [
    ...enrollments.map((e) => ({
      id: e._id,
      course: e.course,
      progress: e.progress || 0,
    })),
    ...(user?.enrolledCourses?.map((course) => ({
      id: course._id,
      course,
      progress: 0,
    })) || []),
  ];

  // 4️⃣ Deduplicate by course ID
  const unique = combined.filter(
    (v, i, arr) =>
      arr.findIndex((t) => t.course._id.toString() === v.course._id.toString()) === i
  );

  // 5️⃣ Sort again (newest first)
  const sorted = unique.sort(
    (a, b) =>
      new Date(b.course?.createdAt || 0) - new Date(a.course?.createdAt || 0)
  );

  res.json(sorted);
});
