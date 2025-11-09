import "dotenv/config"; // ✅ Load .env first
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

import app from "./app.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("✅ .env loaded from:", path.resolve(__dirname, "../.env"));

const PORT = process.env.PORT || 5000;

/* ============================================================
   🧠 Helper: Get Local Network IP (for testing on phone)
============================================================ */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIP = getLocalIP();

/* ============================================================
   🚀 Start the Server
============================================================ */
async function start() {
  await connectDB();

  // ✅ Important: listen on 0.0.0.0 to allow mobile access
  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server running successfully:");
    console.log(`   → Local:   http://localhost:${PORT}`);
    console.log(`   → Network: http://${localIP}:${PORT}`);
    console.log("🌐 Use the 'Network' URL on your phone (same Wi-Fi)");

    // ✅ Render Keep Alive (every 10 minutes)
    setInterval(() => {
      fetch("https://lms-greenarccommune-2.onrender.com/api/ping")
        .then(() =>
          console.log(`[${new Date().toISOString()}] 🔁 Keep-alive ping ok`)
        )
        .catch(() =>
          console.warn(`[${new Date().toISOString()}] ⚠️ Ping failed`)
        );
    }, 600000);
  });
}

/* ============================================================
   ❌ Error Handling on Startup
============================================================ */
start().catch((err) => {
  console.error("❌ Failed to start server", err);
  process.exit(1);
});
