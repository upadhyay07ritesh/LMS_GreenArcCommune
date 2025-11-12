// server/src/config/db.js
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ MONGODB_URI not set in .env");

  try {
    mongoose.set("strictQuery", true);
    mongoose.set("bufferCommands", false); // Avoid request buffering when disconnected

    const conn = await mongoose.connect(uri, {
      autoIndex: true, // builds indexes automatically
      maxPoolSize: 10, // handles concurrent requests efficiently
    });

    console.log("\n✅ MongoDB Connected Successfully");
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database: ${conn.connection.name}`);

    // 🔄 Connection state listeners
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
