import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middlewares/auth.js';
import {
  getNotifications,
  getAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification
} from '../controllers/notificationController.js';
import { runValidation } from '../middlewares/validate.js';

const router = express.Router();

// Public route - get notifications (requires auth but any role)
router.get('/', protect, getNotifications);

// Admin routes
router.use(protect, authorize('admin'));

router.get('/all', getAllNotifications);
router.post('/', [
  body('title').notEmpty(),
  body('message').notEmpty(),
  body('type').optional().isIn(['info', 'success', 'warning', 'error']),
  body('targetRole').optional().isIn(['all', 'student', 'admin'])
], runValidation, createNotification);
router.put('/:id', updateNotification);
router.delete('/:id', deleteNotification);

export default router;

