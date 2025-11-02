import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password');
  res.json(students);
});

export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'banned'
  const student = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

export const analytics = asyncHandler(async (req, res) => {
  const { Enrollment } = await import('../models/Enrollment.js');
  
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
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
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
        as: 'course'
      }
    },
    { $unwind: '$course' },
    { $project: { title: '$course.title', enrollments: '$count' } }
  ]);
  
  // Category distribution
  const categoryStats = await Course.aggregate([
    { $match: { published: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  res.json({
    totalStudents,
    activeStudents,
    totalCourses,
    activeCourses,
    totalEnrollments,
    enrollmentsByMonth,
    popularCourses,
    categoryStats
  });
});
