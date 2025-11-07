import express from 'express';
import { body } from 'express-validator';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enroll,
  markContentComplete,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { runValidation } from '../middlewares/validate.js';
import { getMyEnrollments } from '../controllers/studentController.js'; // ✅ Reuse student logic

const router = express.Router();

// ✅ Public routes
router.get('/', listCourses);
router.get('/:id', protect, getCourse);

// ✅ Admin routes
router.post('/', protect, authorize('admin'), [body('title').notEmpty()], runValidation, createCourse);
router.put('/:id', protect, authorize('admin'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

// ✅ Student routes
router.post(
  '/enroll',
  protect,
  authorize('student'),
  [body('courseId').notEmpty()],
  runValidation,
  enroll
);

// ✅ Student enrollments (merged admin + manual)
router.get('/me/enrollments', protect, getMyEnrollments);

router.post(
  '/progress',
  protect,
  authorize('student'),
  [body('enrollmentId').notEmpty(), body('contentId').notEmpty()],
  runValidation,
  markContentComplete
);

export default router;
