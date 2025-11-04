import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../models/User.js";

dotenv.config();

// ======================
// 📩 SEND OTP CONTROLLER
// ======================
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate and hash OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    user.resetOtpHash = otpHash;
    user.resetOtpExpires = otpExpiry;
    await user.save();

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // use TLS (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify SMTP connection before sending
    await transporter.verify();
    console.log("✅ SMTP connected successfully");

    // Send mail
    await transporter.sendMail({
      from: `"LMS Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });

    console.log("✅ OTP sent successfully to:", email);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// ======================
// 🔐 VERIFY OTP CONTROLLER
// ======================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+resetOtpHash +resetOtpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.resetOtpHash || !user.resetOtpExpires) {
      return res.status(400).json({ message: "OTP not requested" });
    }

    if (Date.now() > user.resetOtpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Optional: clear OTP fields once verified
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Step 1: Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Step 2: Check OTP validity again
    const isOtpValid = await bcrypt.compare(otp, user.resetOtpHash || "");
    if (!isOtpValid) return res.status(400).json({ message: "Invalid OTP" });

    if (Date.now() > user.resetOtpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Step 3: Hash new password and save
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Step 4: Clear OTP fields
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};
