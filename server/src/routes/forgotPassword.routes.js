import express from "express";
import { body } from "express-validator";
import { requestOtp, verifyOtp, resetPassword } from "../controllers/forgotPassword.controller.js";
import { runValidation } from "../middlewares/validate.js";

const router = express.Router();

// Request OTP
router.post(
  "/request-otp",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
  ],
  runValidation,
  requestOtp
);

// Verify OTP
router.post(
  "/verify-otp",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
  ],
  runValidation,
  verifyOtp
);

// Reset Password
router.post(
  "/reset",
  [
    body("resetToken")
      .notEmpty()
      .withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  runValidation,
  resetPassword
);

export default router;
