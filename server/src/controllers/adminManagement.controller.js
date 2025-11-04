import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/email.js';

// List all admins
export const listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' })
    .select('-password -passwordHistory')
    .sort({ createdAt: -1 });
  res.json(admins);
});

// Add new admin
export const addAdmin = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ 
      message: 'User with this email already exists' 
    });
  }

  // Generate a temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(tempPassword, salt);

  // Create new admin user
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    emailVerified: false,
    status: 'active'
  });

  // Send email with temporary password
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Welcome to GreenArc LMS Admin Team</h1>
      <p>Hello ${name},</p>
      <p>You have been added as an administrator to the GreenArc LMS platform.</p>
      <p>Here are your temporary login credentials:</p>
      <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <p><strong>Important:</strong> Please log in and change your password immediately.</p>
      <p>If you believe this was a mistake, please contact the super admin.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to GreenArc LMS Admin Team',
      html,
      text: `Welcome to GreenArc LMS Admin Team. Your temporary password is: ${tempPassword}. Please log in and change your password immediately.`
    });
  } catch (error) {
    // Delete the created admin if email fails
    await User.findByIdAndDelete(admin._id);
    throw new Error('Failed to send welcome email. Admin not created.');
  }

  res.status(201).json({
    message: 'Admin created successfully. Login credentials sent via email.',
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  });
});

// Update admin status
export const updateAdminStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const adminId = req.params.id;

  // Prevent self-deactivation
  if (adminId === req.user.id) {
    return res.status(400).json({ 
      message: 'You cannot modify your own admin status' 
    });
  }

  const admin = await User.findOneAndUpdate(
    { _id: adminId, role: 'admin' },
    { status },
    { new: true }
  ).select('-password -passwordHistory');

  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  res.json(admin);
});

// Remove admin role
export const removeAdmin = asyncHandler(async (req, res) => {
  const adminId = req.params.id;

  // Prevent self-removal
  if (adminId === req.user.id) {
    return res.status(400).json({ 
      message: 'You cannot remove your own admin privileges' 
    });
  }

  const admin = await User.findOneAndUpdate(
    { _id: adminId, role: 'admin' },
    { role: 'student', studentId: `STU${Date.now()}` },
    { new: true }
  ).select('-password -passwordHistory');

  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  // Send notification email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Admin Access Removed</h1>
      <p>Hello ${admin.name},</p>
      <p>Your administrator access to the GreenArc LMS platform has been removed.</p>
      <p>If you believe this was a mistake, please contact the super admin.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: admin.email,
      subject: 'GreenArc LMS Admin Access Removed',
      html,
      text: `Your administrator access to the GreenArc LMS platform has been removed. If you believe this was a mistake, please contact the super admin.`
    });
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }

  res.json({
    message: 'Admin role removed successfully',
    user: admin
  });
});