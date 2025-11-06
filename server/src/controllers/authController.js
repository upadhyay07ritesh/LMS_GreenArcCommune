import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/email.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, studentId } = req.body;
  const exists = await User.findOne({ $or: [{ email }, { studentId }] });
  if (exists) return res.status(409).json({ message: 'Email or Student ID already in use' });
  const user = await User.create({ name, email, password, studentId, role: 'student' });
  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const match = await user.matchPassword(password);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  if (user.status === 'banned') return res.status(403).json({ message: 'Account banned' });
  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  // For stateless JWT, logout is handled on client by removing token
  res.json({ message: 'Logged out' });
});

// Forgot password - request OTP
export const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  console.log("OTP resend request received for:", req.body.email);
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Always respond with success to prevent email enumeration
    return res.json({ message: 'If the email exists, an OTP has been sent' });
  }

  // Enforce a cooldown (e.g., 30 seconds between resend attempts)
  const cooldownPeriod = 30 * 1000; // 30 seconds

  if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < cooldownPeriod) {
    const remaining = Math.ceil((cooldownPeriod - (Date.now() - user.lastOtpSentAt.getTime())) / 1000);
    return res.status(429).json({
      message: `Please wait ${remaining}s before requesting another OTP`,
      retryAfter: remaining
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Hash OTP before saving
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  // Save OTP hash, expiry, and last sent time
  user.resetOtpHash = otpHash;
  user.resetOtpExpires = new Date(otpExpiry);
  user.lastOtpSentAt = new Date(); // <--- Track last send time

  const appName = process.env.APP_NAME || 'GreenArc LMS';
  const username = user.name || 'User';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">${appName} Password Reset</h1>
      <p>Hello ${username},</p>
      <p>Your new One-Time Password (OTP) is:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; letter-spacing: 2px; font-weight: bold;">${otp}</span>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn’t request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `${appName} Password Reset OTP`,
      html,
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`
    });

    await user.save(); // ✅ Save after email is sent successfully

    res.json({
      message: 'OTP has been sent to your email',
      expiresIn: 600, // 10 minutes in seconds
      cooldown: 30, // 30 seconds for next resend
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return res.status(500).json({
      message: 'Failed to send OTP email. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and get reset token
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ 
    email,
    resetOtpExpires: { $gt: Date.now() }
  }).select('+resetOtpHash');

  if (!user || !user.resetOtpHash) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Verify OTP
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  if (otpHash !== user.resetOtpHash) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // Clear OTP fields after successful verification
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  // Generate a temporary token for password reset
  const resetToken = jwt.sign(
    { id: user._id, purpose: 'password-reset' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );

  res.json({ resetToken });
});

// Reset password with token
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});
