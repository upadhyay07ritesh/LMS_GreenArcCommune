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
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Always respond with success to prevent email enumeration
    return res.json({ message: 'If the email exists, an OTP has been sent' });
  }

  // Check if OTP was recently sent (within last 1 minute)
  if (user.resetOtpExpires && user.resetOtpExpires.getTime() > Date.now() - 60000) {
    return res.status(429).json({ 
      message: 'Please wait a minute before requesting another OTP',
      retryAfter: Math.ceil((user.resetOtpExpires.getTime() - Date.now() + 60000) / 1000)
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Hash OTP before saving
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  
  // Save OTP hash and expiry
  user.resetOtpHash = otpHash;
  user.resetOtpExpires = new Date(otpExpiry);
  
  // Send OTP email
  const appName = process.env.APP_NAME || 'GreenArc LMS';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">${appName} Password Reset</h1>
      <p>Hello,</p>
      <p>You have requested to reset your password. Here is your one-time password (OTP):</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; letter-spacing: 2px; font-weight: bold;">${otp}</span>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p style="color: #64748b; margin-top: 20px;">If you didn't request this password reset, please ignore this email.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #64748b; font-size: 12px;">This is an automated message, please do not reply.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: `${appName} Password Reset OTP`,
      html,
      text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`
    });

    // Only save user after email is sent successfully
    await user.save();

    res.json({ 
      message: 'OTP has been sent to your email',
      expiresIn: 600 // 10 minutes in seconds
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
