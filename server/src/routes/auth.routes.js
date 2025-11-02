import express from 'express';
import { body } from 'express-validator';
import { signup, login, me, logout, requestPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithOtp } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { runValidation } from '../middlewares/validate.js';

const router = express.Router();

router.post(
  '/signup',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 }), body('studentId').notEmpty()],
  runValidation,
  signup
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], runValidation, login);
router.get('/me', protect, me);
router.post('/logout', protect, logout);

// Forgot password via OTP
router.post(
  '/forgot-password/request-otp',
  [body('email').isEmail()],
  runValidation,
  requestPasswordResetOtp
);

router.post(
  '/forgot-password/verify-otp',
  [body('email').isEmail(), body('otp').isLength({ min: 4 })],
  runValidation,
  verifyPasswordResetOtp
);

router.post(
  '/forgot-password/reset',
  [body('email').isEmail(), body('otp').isLength({ min: 4 }), body('password').isLength({ min: 6 })],
  runValidation,
  resetPasswordWithOtp
);

export default router;
