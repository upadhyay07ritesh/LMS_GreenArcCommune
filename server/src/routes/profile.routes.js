import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/auth.js';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { runValidation } from '../middlewares/validate.js';

const router = express.Router();

router.use(protect);

router.get('/', getProfile);
router.put('/', [
  body('password').optional().isLength({ min: 6 }),
  body('email').optional().isEmail(),
], runValidation, updateProfile);

export default router;

