import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    targetRole: { type: String, enum: ['all', 'student', 'admin'], default: 'all' }, // Who should see this
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date } // Optional expiration
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);

