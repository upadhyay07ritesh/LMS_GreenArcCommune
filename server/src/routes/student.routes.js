import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { profile } from '../controllers/studentController.js';

const router = express.Router();

router.use(protect, authorize('student'));

router.get('/profile', profile);

export default router;
