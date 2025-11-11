import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current admin profile
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -passwordHistory');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    user
  });
});

// Update admin profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, adminMeta } = req.body;
  const updates = { name, email };

  // Parse adminMeta if it's a string
  if (adminMeta) {
    try {
      updates.adminMeta = typeof adminMeta === 'string' ? JSON.parse(adminMeta) : adminMeta;
    } catch (error) {
      console.warn('Error parsing adminMeta:', error);
    }
  }

  // Handle file upload
  if (req.file) {
    // Delete old profile picture if exists
    if (req.user.avatar) {
      const oldImagePath = path.join(__dirname, '..', '..', req.user.avatar.replace(/^\//, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old profile image:', err);
        });
      }
    }
    
    updates.avatar = `/uploads/${req.file.filename}`;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password -passwordHistory');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
});

// Remove profile image
export const removeProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.avatar) {
    const imagePath = path.join(__dirname, '..', '..', user.avatar.replace(/^\//, ''));
    
    // Delete the file
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting profile image:', err);
      });
    }

    // Update user record
    user.avatar = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image removed successfully',
      user: await User.findById(req.user._id).select('-password -passwordHistory')
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No profile image to remove'
    });
  }
});

// Update password
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  // Check if current password is correct
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Check if new password is the same as current password
  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from current password'
    });
  }

  // Check password history (prevent reusing last 3 passwords)
  const isUsed = await Promise.all(
    user.passwordHistory.map(async (oldHash) => {
      return await bcrypt.compare(newPassword, oldHash);
    })
  );

  if (isUsed.includes(true)) {
    return res.status(400).json({
      success: false,
      message: 'You have already used this password recently. Please choose a different one.'
    });
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and add to history (keep last 3 passwords)
  user.password = hashedPassword;
  user.passwordHistory = [hashedPassword, ...user.passwordHistory].slice(0, 3);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// Get admin by ID
export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await User.findOne({
    _id: req.params.id,
    role: 'admin'
  }).select('-password -passwordHistory');

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    });
  }

  res.status(200).json({
    success: true,
    admin
  });
});
