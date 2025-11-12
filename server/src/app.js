// server/src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// 🧩 Routes
import liveSessionsRouter from "./routes/LiveSessions.routes.js";
import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import testEmailRoutes from "./routes/testEmail.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import forgotPasswordRoutes from "./routes/forgotPassword.routes.js";
import adminManagementRoutes from "./routes/adminManagement.routes.js";
import messageRoutes from "./routes/message.routes.js";

const app = express();

/* ============================================================
   📁 Path Setup
============================================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ============================================================
   🌐 Smart Dynamic CORS Configuration
============================================================ */
function getLocalNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  Object.values(interfaces).forEach((ifaceList) => {
    ifaceList.forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(`http://${iface.address}:5173`);
      }
    });
  });
  return ips;
}

const dynamicLocalIPs = getLocalNetworkIPs();

const allowedOrigins = [
  "http://localhost:5173",
  "https://lms.greenarccommune.com",
  "https://lms-greenarccommune-1.onrender.com",
  "https://lms-greenarccommune-2.onrender.com",
  `http://${process.env.ALLOWED_DEV_IP}:5173`,
  ...dynamicLocalIPs,
];

// ✅ CORS Middleware (Global)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`🚫 Blocked by CORS: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Pragma",
    "Cache-Control",
  ],
  exposedHeaders: ["Content-Disposition"],
}));

// Enable CORS preflight for all routes
app.options("*", cors());

/* ============================================================
   🧠 Global Middleware (Performance + Security)
============================================================ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(compression());
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per 15 min
  message: "Too many requests, please try again later.",
}));

// 🧱 Disable cache for API only (not static assets)
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/* ============================================================
   🩺 Health Check
============================================================ */
app.get("/api/ping", (req, res) => res.send("pong"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.send("✅ GreenArc LMS Backend is Live!"));

/* ============================================================
   🖼️ Static Files
============================================================ */
app.use("/uploads", express.static(uploadsDir));
const legacyUploadsDir = path.join(__dirname, "../uploads");
if (fs.existsSync(legacyUploadsDir)) app.use("/uploads", express.static(legacyUploadsDir));

/* ============================================================
   📦 Routes
============================================================ */
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manage-admins", adminManagementRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/test-email", testEmailRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auth/forgot-password", forgotPasswordRoutes);
app.use("/api/livesessions", liveSessionsRouter);
app.use("/api/messages", messageRoutes);

/* ============================================================
   🚨 Error Handling
============================================================ */
app.use(notFound);
app.use(errorHandler);

export default app;
