// server/src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

// 🧩 Routes
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminManagementRoutes from "./routes/adminManagement.routes.js";
import courseRoutes from "./routes/course.routes.js";
import studentRoutes from "./routes/student.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import forgotPasswordRoutes from "./routes/forgotPassword.routes.js";
import messageRoutes from "./routes/message.routes.js";
import liveSessionsRouter from "./routes/LiveSessions.routes.js";
import tradeJournalRoutes from "./routes/tradeJournal.routes.js";

const app = express();

/* ============================================================
   📁 File + Path Setup
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
      if (iface.family === "IPv4" && !iface.internal)
        ips.push(`http://${iface.address}:5173`);
    });
  });
  return ips;
}

const dynamicLocalIPs = getLocalNetworkIPs();
const allowedOrigins = [
  "http://localhost:5173",
  "https://lms.greenarccommune.com",
  "https://lms-greenarccommune-1.onrender.com",
  ...dynamicLocalIPs,
];

app.use(
  cors({
    origin(origin, callback) {
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
      "Expires",
      "Origin",
      "X-Auth-Token"
    ],
    exposedHeaders: ["Content-Disposition", "Authorization"],
    optionsSuccessStatus: 204,
    preflightContinue: false,
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
   🧠 Safe Optional Middleware (Helmet, Compression)
============================================================ */
try {
  const helmetModule = await import("helmet");
  const helmet = helmetModule.default;
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    })
  );
  console.log("✅ Helmet enabled");
} catch {
  console.warn("⚠️ Helmet missing, skipping...");
}

try {
  const compressionModule = await import("compression");
  const compression = compressionModule.default;
  app.use(compression());
  console.log("✅ Compression enabled");
} catch {
  console.warn("⚠️ Compression missing, skipping...");
}

/* ============================================================
   🧱 Cache Control
============================================================ */
app.use("/api", (req, res, next) => {
  if (!req.originalUrl.startsWith("/api/admin")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
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

/* ============================================================
   📦 Routes
============================================================ */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", adminManagementRoutes); // Add this line for student management routes
app.use("/api/courses", courseRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/auth/forgot-password", forgotPasswordRoutes);
app.use("/api/livesessions", liveSessionsRouter);
app.use("/api/messages", messageRoutes);
app.use("/api/manage-admins", adminManagementRoutes);
app.use("/api/journals/trade", tradeJournalRoutes);

/* ============================================================
   ❌ Fallback for Unknown Routes
============================================================ */
app.all("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

/* ============================================================
   🚨 Error Handling
============================================================ */
app.use(notFound);
app.use(errorHandler);

export default app;
