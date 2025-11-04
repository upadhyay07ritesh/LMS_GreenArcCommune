// utils/redisClient.js
import { createClient } from "redis";

let redisClient;

try {
  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  redisClient.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  await redisClient.connect();
  console.log("✅ Redis connected successfully");
} catch (err) {
  console.log("⚠️ Redis not available, fallback to MongoDB only");
  redisClient = null;
}

export default redisClient;
