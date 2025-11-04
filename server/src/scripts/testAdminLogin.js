import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testAdminLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL }).select('+password');
    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', {
      email: admin.email,
      role: admin.role,
      status: admin.status,
      hasPassword: !!admin.password
    });

    // Test password match
    const testPassword = process.env.ADMIN_PASSWORD;
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    console.log('Password match test:', isMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminLogin();