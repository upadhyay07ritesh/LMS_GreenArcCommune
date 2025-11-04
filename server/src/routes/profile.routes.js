import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/auth.js';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController.js';
import { runValidation } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', [
  body('password').optional().isLength({ min: 6 }),
  body('email').optional().isEmail(),
], runValidation, updateProfile);

router.patch('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], runValidation, changePassword);

export default router;

