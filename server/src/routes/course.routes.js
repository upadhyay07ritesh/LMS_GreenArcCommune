import express from 'express';
import { body } from 'express-validator';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enroll,
  myEnrollments,
  markContentComplete,
} from '../controllers/courseController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { runValidation } from '../middlewares/validate.js';

const router = express.Router();

router.get('/', listCourses);
router.get('/:id', protect, getCourse);

router.post('/', protect, authorize('admin'), [body('title').notEmpty()], runValidation, createCourse);
router.put('/:id', protect, authorize('admin'), updateCourse);
router.delete('/:id', protect, authorize('admin'), deleteCourse);

router.post('/enroll', protect, authorize('student'), [body('courseId').notEmpty()], runValidation, enroll);
router.get('/me/enrollments', protect, authorize('student'), myEnrollments);
router.post('/progress', protect, authorize('student'), [body('enrollmentId').notEmpty(), body('contentId').notEmpty()], runValidation, markContentComplete);

export default router;
