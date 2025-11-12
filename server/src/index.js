// server/src/index.js
import "dotenv/config"; // ✅ Load environment variables first
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

import app from "./app.js";
import { connectDB } from "./config/db.js";

// ============================================================
// 📁 Path Setup
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("✅ .env loaded from:", path.resolve(__dirname, "../.env"));

const PORT = process.env.PORT || 5000;

// ============================================================
// 🔍 Validate Required Environment Variables
// ============================================================
const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("❌ Missing required environment variables:", missing.join(", "));
  process.exit(1);
}

// ============================================================
// 🌐 Helper: Get Local Network IP (for testing on phone)
// ============================================================
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

// ============================================================
// 🚀 Start Server Function
// ============================================================
async function start() {
  console.log("🧠 Connecting to MongoDB...");
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log("\n🚀 Server running successfully!");
    console.log(`   → Local:   http://localhost:${PORT}`);
    console.log(`   → Network: http://${localIP}:${PORT}`);
    console.log("🌐 Use the Network URL on your phone (same Wi-Fi)\n");

    // 🟢 Keep-Alive Ping (for Render uptime)
    if (process.env.NODE_ENV === "production") {
      console.log("🔁 Keep-alive ping started (every 10 min)...");
      setInterval(() => {
        fetch("https://lms-greenarccommune-1.onrender.com/api/ping")
          .then(() =>
            console.log(`[${new Date().toISOString()}] 🔁 Ping OK`)
          )
          .catch(() =>
            console.warn(`[${new Date().toISOString()}] ⚠️ Ping failed`)
          );
      }, 600_000); // 10 minutes
    }
  });
}

// ============================================================
// ❌ Error Handling on Startup
// ============================================================
start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

// ============================================================
// 🛑 Graceful Shutdown Handling
// ============================================================
process.on("SIGINT", async () => {
  console.log("\n🛑 Gracefully shutting down server...");
  process.exit(0);
});
