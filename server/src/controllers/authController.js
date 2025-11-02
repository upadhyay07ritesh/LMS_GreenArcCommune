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
  const user = await User.findOne({ email });
  // Always respond with success to prevent email enumeration
  if (!user) return res.json({ message: 'If the email exists, an OTP has been sent.' });

  const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit
  const hash = crypto.createHash('sha256').update(otp).digest('hex');

  user.resetOtpHash = hash;
  user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  const appName = process.env.APP_NAME || 'GreenArc LMS';
  const subject = `${appName} Password Reset OTP`;
  const html = `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 10 minutes.</p>`;
  const text = `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`;
  try {
    await sendEmail({ to: email, subject, html, text });
  } catch (e) {
    // Do not leak errors to client for security; still respond generically
  }
  return res.json({ message: 'If the email exists, an OTP has been sent.' });
});

// Verify OTP (without resetting password)
export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email }).select('+resetOtpHash resetOtpExpires');
  if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ message: 'Invalid or expired OTP' });
  if (user.resetOtpExpires.getTime() < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });
  const providedHash = crypto.createHash('sha256').update(otp).digest('hex');
  if (providedHash !== user.resetOtpHash) return res.status(400).json({ message: 'Invalid or expired OTP' });
  return res.json({ message: 'OTP verified' });
});

// Reset password with OTP
export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email }).select('+resetOtpHash resetOtpExpires +password');
  if (!user || !user.resetOtpHash || !user.resetOtpExpires) return res.status(400).json({ message: 'Invalid or expired OTP' });
  if (user.resetOtpExpires.getTime() < Date.now()) return res.status(400).json({ message: 'Invalid or expired OTP' });
  const providedHash = crypto.createHash('sha256').update(otp).digest('hex');
  if (providedHash !== user.resetOtpHash) return res.status(400).json({ message: 'Invalid or expired OTP' });

  user.password = password;
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  await user.save();
  return res.json({ message: 'Password reset successful' });
});
