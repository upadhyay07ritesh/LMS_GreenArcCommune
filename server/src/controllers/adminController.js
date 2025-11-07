import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/* -------------------------------------------
   ✅ List All Students
------------------------------------------- */
export const listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password');
  res.json(students);
});

/* -------------------------------------------
   ✅ Create a Student and Auto-Enroll in Course
------------------------------------------- */
export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, course, dob, studentId, password } = req.body;

  // 1️⃣ Validate required fields
  if (!name || !email || !studentId || !course)
    return res.status(400).json({ message: "Missing required fields" });

  // 2️⃣ Find course by title or ID
  const selectedCourse = await Course.findOne({
    $or: [{ _id: course }, { title: course }],
  });

  if (!selectedCourse)
    return res.status(404).json({ message: "Selected course not found" });

  // 3️⃣ Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "Email already registered" });

  // 4️⃣ Create the student
  const newStudent = await User.create({
    name,
    email,
    phone,
    dob,
    role: "student",
    studentId,
    password,
    status: "active",
  });

  // 5️⃣ Auto-create enrollment
  await Enrollment.create({
    user: newStudent._id,
    course: selectedCourse._id,
    progress: 0,
  });

  res.status(201).json({
    message: "Student created and enrolled successfully",
    student: newStudent,
  });
});

/* -------------------------------------------
   ✅ Update Student Status (Active / Banned)
------------------------------------------- */
export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'banned'
  const student = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

/* -------------------------------------------
   ✅ Analytics Dashboard
------------------------------------------- */
export const analytics = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const activeStudents = await User.countDocuments({ role: 'student', status: 'active' });
  const totalCourses = await Course.countDocuments({});
  const activeCourses = await Course.countDocuments({ published: true });
  const totalEnrollments = await Enrollment.countDocuments();

  // Enrollment trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const enrollmentsByMonth = await Enrollment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Course popularity
  const popularCourses = await Enrollment.aggregate([
    { $group: { _id: '$course', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    { $project: { title: '$course.title', enrollments: '$count' } },
  ]);

  // Category distribution
  const categoryStats = await Course.aggregate([
    { $match: { published: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    totalStudents,
    activeStudents,
    totalCourses,
    activeCourses,
    totalEnrollments,
    enrollmentsByMonth,
    popularCourses,
    categoryStats,
  });
});
