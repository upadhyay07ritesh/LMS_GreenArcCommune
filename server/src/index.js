// server/src/index.js
import "dotenv/config"; // Load environment variables first
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import fetch from "node-fetch";
import { Server as IOServer } from "socket.io";
import { scheduleAllUpcomingSessions } from "../src/utils/sessionScheduler.js";

import app from "./app.js";
import { connectDB } from "./config/db.js";

/* ============================================================
   📁 Path Setup
============================================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("✅ .env loaded from:", path.resolve(__dirname, "../.env"));

/* ============================================================
   🌍 Server + Socket.IO Setup
============================================================ */
const PORT = process.env.PORT || 5000;

// Create HTTP server from our Express app
const server = http.createServer(app);

// Attach Socket.IO
const io = new IOServer(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// Attach io object so controllers can use req.app.get("io")
app.set("io", io);

/* ============================================================
   🔌 Socket.IO Events
============================================================ */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("live:sessionStarted", (data) => {
    io.emit("live:sessionStarted", data); // broadcast to all
  });

  socket.on("live:sessionEnded", (data) => {
    io.emit("live:sessionEnded", data); // broadcast to all
  });

  socket.on("live:sessionCreated", (data) => {
    io.emit("live:sessionCreated", data);
  });

  socket.on("live:sessionDeleted", (data) => {
    io.emit("live:sessionDeleted", data);
  });
});


/* ============================================================
   🔍 Validate Required Environment Variables
============================================================ */
const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missing.join(", ")
  );
  process.exit(1);
}

/* ============================================================
   🌐 Helper: Get Local Network IP
============================================================ */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}
const localIP = getLocalIP();

/* ============================================================
   🚀 START SERVER
============================================================ */
async function start() {
  console.log("🧠 Connecting to MongoDB...");
  await connectDB();

  server.listen(PORT, "0.0.0.0", () => {
    console.log("\n🚀 Server running with Socket.IO!");
    console.log(`   → Local:   http://localhost:${PORT}`);
    console.log(`   → Network: http://${localIP}:${PORT}`);
    console.log("🌐 Use the Network URL on your phone (same Wi-Fi)\n");
  scheduleAllUpcomingSessions(); 

    // Keep Render alive
    if (process.env.NODE_ENV === "production") {
      console.log("🔁 Keep-alive ping started (every 10 min)...");
      setInterval(() => {
        fetch("https://lms-greenarccommune-1.onrender.com/api/ping")
          .then(() => console.log(`[${new Date().toISOString()}] 🔁 Ping OK`))
          .catch(() =>
            console.warn(`[${new Date().toISOString()}] ⚠️ Ping failed`)
          );
      }, 600_000);
    }
  });
}

/* ============================================================
   ❌ Error Handling at Startup
============================================================ */
start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

/* ============================================================
   🛑 Graceful Shutdown
============================================================ */
process.on("SIGINT", async () => {
  console.log("\n🛑 Gracefully shutting down server...");
  process.exit(0);
});
