import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import { otpEmailTemplate } from "../utils/emailTemplates.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Step 1: Request OTP ---
export const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  // For security, don't reveal if user exists or not
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "If the email exists, an OTP has been sent" });
  }

  // Check for rate limiting
  if (user.resetOtpExpires && user.resetOtpExpires > Date.now() - 60000) {
    return res.status(429).json({ 
      message: "Please wait 1 minute before requesting another OTP",
      retryAfter: Math.ceil((user.resetOtpExpires - Date.now() + 60000) / 1000)
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
  const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");

  // Log OTP generation for debugging
  console.log('OTP Generation:', {
    otp,
    otpLength: otp.length,
    timestamp: new Date()
  });

  // Update user with new OTP hash and expiry
  user.resetOtpHash = otpHash;
  user.resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  try {
    const template = otpEmailTemplate(otp);
    await sendEmail({
      to: email,
      ...template
    });

    await user.save();
    res.json({ 
      message: "If the email exists, an OTP has been sent",
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    // Reset OTP fields if email fails
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again later." });
  }
});

// --- Step 2: Verify OTP ---
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const user = await User.findOne({ email }).select("+resetOtpHash +resetOtpExpires");
  
  // Debug log to check if we're finding the user and their OTP data
  console.log('Verification attempt:', {
    userFound: !!user,
    hasOtpHash: !!user?.resetOtpHash,
    hasOtpExpiry: !!user?.resetOtpExpires,
    otpExpired: user?.resetOtpExpires < Date.now()
  });

  if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
    return res.status(400).json({ 
      message: "Invalid or expired OTP",
      debug: "User not found or OTP data missing"
    });
  }

  const providedOtpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");
  const isOtpMatch = user.resetOtpHash === providedOtpHash;
  const isExpired = user.resetOtpExpires < Date.now();

  // Debug log to check OTP matching
  console.log('OTP Check:', {
    isOtpMatch,
    isExpired,
    providedOtp: otp,
    otpExpiry: user.resetOtpExpires
  });

  if (!isOtpMatch || isExpired) {
    return res.status(400).json({ 
      message: "Invalid or expired OTP",
      debug: isExpired ? "OTP has expired" : "OTP does not match"
    });
  }

  // Generate a temporary token for password reset
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  // Save reset token hash with 15 minutes expiry
  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  
  // Clear OTP fields after successful verification
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  res.json({ 
    message: "OTP verified successfully",
    resetToken,
    expiresIn: 900 // 15 minutes in seconds
  });
});

// --- Step 3: Reset Password ---
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: "Reset token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  
  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  // Check if new password matches any of the last 3 passwords
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);
  
  if (user.passwordHistory) {
    for (const oldPassword of user.passwordHistory.slice(-3)) {
      const matchesOld = await bcrypt.compare(newPassword, oldPassword);
      if (matchesOld) {
        return res.status(400).json({ 
          message: "Please use a password you haven't used recently" 
        });
      }
    }
  }

  // Update password and maintain history
  user.password = newPassword;
  user.passwordHistory = [
    ...(user.passwordHistory || []).slice(-2), // Keep last 3 passwords
    newPasswordHash
  ];
  user.lastPasswordChange = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful" });
});
