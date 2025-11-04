import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    }

    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Updating existing admin password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      admin = await User.findOneAndUpdate(
        { email: adminEmail },
        { 
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          emailVerified: true
        },
        { new: true }
      );
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      admin = await User.create({
        name: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        emailVerified: true
      });
    }

    console.log('Admin user ready:', {
      email: admin.email,
      role: admin.role,
      status: admin.status
    });

    // Verify the password works
    const verifyAdmin = await User.findOne({ email: adminEmail }).select('+password');
    const isMatch = await bcrypt.compare(adminPassword, verifyAdmin.password);
    console.log('Password verification:', isMatch ? 'SUCCESS' : 'FAILED');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();