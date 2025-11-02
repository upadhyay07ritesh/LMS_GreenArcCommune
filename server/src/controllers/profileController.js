import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -resetOtpHash -resetOtpExpires');
  res.json({ user });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, studentId, password, avatar } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // Update allowed fields
  if (name) user.name = name;
  if (email && email !== user.email) {
    // Check if new email is already in use
    const exists = await User.findOne({ email, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    user.email = email;
    user.emailVerified = false; // Require re-verification if email changes
  }
  if (studentId && studentId !== user.studentId) {
    const exists = await User.findOne({ studentId, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ message: 'Student ID already in use' });
    user.studentId = studentId;
  }
  if (avatar) user.avatar = avatar;
  if (password) {
    user.password = password; // Will be hashed by pre-save hook
  }
  
  await user.save();
  const updated = await User.findById(user._id).select('-password -resetOtpHash -resetOtpExpires');
  res.json({ user: updated });
});

