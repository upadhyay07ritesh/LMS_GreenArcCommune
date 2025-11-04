import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import adminRoutes from './routes/admin.routes.js';
import studentRoutes from './routes/student.routes.js';
import profileRoutes from './routes/profile.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import testEmailRoutes from './routes/testEmail.routes.js';
import otpRoutes from "./routes/otp.routes.js";
import forgotPasswordRoutes from "./routes/forgotPassword.routes.js";
import adminManagementRoutes from "./routes/adminManagement.routes.js";
import { notFound, errorHandler } from './middlewares/errorHandler.js';


const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = [
  'http://localhost:5173',         // local dev
  'https://lms.greenarccommune.com' // your deployed frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => {
  res.send('Backend server is live and running!');
});
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-management', adminManagementRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use("/api/otp", otpRoutes);
app.use("/auth/forgot-password", forgotPasswordRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
