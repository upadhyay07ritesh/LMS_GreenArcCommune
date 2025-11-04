import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/auth.js';
import { runValidation } from '../middlewares/validate.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import {
  listAdmins,
  addAdmin,
  updateAdminStatus,
  removeAdmin
} from '../controllers/adminManagement.controller.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, requireAdmin);

// List all admins
router.get('/admins', listAdmins);

// Add new admin
router.post(
  '/admins',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email')
  ],
  runValidation,
  addAdmin
);

// Update admin status
router.patch(
  '/admins/:id/status',
  [
    body('status')
      .isIn(['active', 'banned'])
      .withMessage('Status must be either active or banned')
  ],
  runValidation,
  updateAdminStatus
);

// Remove admin role
router.delete('/admins/:id', removeAdmin);

export default router;