import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// 🧩 Import models & routes
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

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created missing uploads directory");
}

/* ============================================================
   🔒 Smart Dynamic CORS
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
  "https://lms-greenarccommune.netlify.app",
  ...dynamicLocalIPs,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


/* ============================================================
   ⚙️ Core Middleware
============================================================ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

/* ============================================================
   🩺 Health Check
============================================================ */
app.get("/api/ping", (req, res) => res.send("pong"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.send("✅ Backend server is live and running!"));

/* ============================================================
   🖼️ Static Uploads Access
============================================================ */
// Serve new uploads directory
app.use("/uploads", express.static(uploadsDir));
// Fallback: also serve legacy uploads (server/src/uploads) for previously uploaded files
const legacyUploadsDir = path.join(__dirname, "../uploads");
if (fs.existsSync(legacyUploadsDir)) {
  app.use("/uploads", express.static(legacyUploadsDir));
}

/* ============================================================
   📦 Main API Routes
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
