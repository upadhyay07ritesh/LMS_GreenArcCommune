import mongoose from "mongoose";
import chalk from "chalk";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ MONGODB_URI not set in .env");

  try {
    mongoose.set("strictQuery", true);
    mongoose.set("bufferCommands", false); // avoid request buffering

    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      maxPoolSize: 10, // efficient concurrent handling
    });

    console.log(chalk.green("✅ MongoDB Connected Successfully"));
    console.log(chalk.cyan(`📡 Host:`), conn.connection.host);
    console.log(chalk.cyan(`🗄️  Database:`), conn.connection.name);

    // 🔄 Connection state listeners
    mongoose.connection.on("disconnected", () =>
      console.warn(chalk.red("⚠️ MongoDB disconnected"))
    );
    mongoose.connection.on("reconnected", () =>
      console.log(chalk.green("🔄 MongoDB reconnected"))
    );
    mongoose.connection.on("error", (err) =>
      console.error(chalk.red("❌ MongoDB error:"), err.message)
    );
  } catch (err) {
    console.error(chalk.red("❌ MongoDB connection failed:"), err.message);
    process.exit(1);
  }
}
