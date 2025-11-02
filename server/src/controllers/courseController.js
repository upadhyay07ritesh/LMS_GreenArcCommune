import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCourses = asyncHandler(async (req, res) => {
  const { search, category, difficulty, sortBy = 'createdAt' } = req.query;
  const query = { published: true };
  
  // Search by title or description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Filter by difficulty
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  // Sort options
  let sort = { createdAt: -1 };
  if (sortBy === 'title') sort = { title: 1 };
  else if (sortBy === 'newest') sort = { createdAt: -1 };
  else if (sortBy === 'oldest') sort = { createdAt: 1 };
  
  const courses = await Course.find(query).sort(sort);
  res.json(courses);
});

export const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json(course);
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json(course);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  // also delete enrollments for this course
  await Enrollment.deleteMany({ course: course._id });
  res.json({ message: 'Course deleted' });
});

export const enroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  const existing = await Enrollment.findOne({ user: req.user._id, course: courseId });
  if (existing) return res.status(409).json({ message: 'Already enrolled' });
  const enr = await Enrollment.create({ user: req.user._id, course: courseId });
  res.status(201).json(enr);
});

export const myEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id }).populate('course');
  const result = enrollments.map((e) => {
    const total = e.course.contents.length || 1;
    const completed = e.completedContentIds.length;
    const progress = Math.round((completed / total) * 100);
    return {
      id: e._id,
      course: e.course,
      progress,
      completedContentIds: e.completedContentIds,
    };
  });
  res.json(result);
});

export const markContentComplete = asyncHandler(async (req, res) => {
  const { enrollmentId, contentId } = req.body;
  const enr = await Enrollment.findOne({ _id: enrollmentId, user: req.user._id });
  if (!enr) return res.status(404).json({ message: 'Enrollment not found' });
  if (!enr.completedContentIds.find((id) => id.toString() === contentId)) {
    enr.completedContentIds.push(contentId);
    await enr.save();
  }
  res.json(enr);
});
