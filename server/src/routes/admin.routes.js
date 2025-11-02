import express from 'express';
import { body } from 'express-validator';
import { authorize, protect } from '../middlewares/auth.js';
import { listStudents, updateStudentStatus, analytics } from '../controllers/adminController.js';
import multer from 'multer';
import path from 'path';
import { handleUpload } from '../controllers/uploadController.js';
import { fileURLToPath } from 'url';

const router = express.Router();

router.use(protect, authorize('admin'));

// students
router.get('/students', listStudents);
router.patch('/students/:id/status', [body('status').isIn(['active', 'banned'])], updateStudentStatus);

// analytics
router.get('/analytics', analytics);

// uploads (videos/pdfs)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), handleUpload);

export default router;
