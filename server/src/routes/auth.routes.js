import express from 'express';
import { body } from 'express-validator';
import { signup, login, me, logout, requestPasswordResetOtp, verifyOtp, resetPassword } from '../controllers/authController.js';
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
  [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric()
  ],
  runValidation,
  verifyOtp
);

router.post(
  '/forgot-password/reset',
  [
    body('resetToken').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  runValidation,
  resetPassword
);

export default router;
