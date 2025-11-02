import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get active notifications for current user's role
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const role = req.user?.role || 'student';
  const now = new Date();
  
  const notifications = await Notification.find({
    isActive: true,
    $or: [
      { targetRole: 'all' },
      { targetRole: role }
    ],
    $and: [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: now } }
        ]
      }
    ]
  }).sort({ createdAt: -1 }).limit(10);
  
  res.json(notifications);
});

/**
 * Get all notifications (admin only)
 */
export const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({}).sort({ createdAt: -1 });
  res.json(notifications);
});

/**
 * Create notification (admin only)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, targetRole, expiresAt } = req.body;
  const notification = await Notification.create({
    title,
    message,
    type: type || 'info',
    targetRole: targetRole || 'all',
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  });
  res.status(201).json(notification);
});

/**
 * Update notification (admin only)
 */
export const updateNotification = asyncHandler(async (req, res) => {
  const { title, message, type, targetRole, isActive, expiresAt } = req.body;
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      ...(title && { title }),
      ...(message && { message }),
      ...(type && { type }),
      ...(targetRole && { targetRole }),
      ...(isActive !== undefined && { isActive }),
      ...(expiresAt && { expiresAt: new Date(expiresAt) })
    },
    { new: true }
  );
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json(notification);
});

/**
 * Delete notification (admin only)
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  res.json({ message: 'Notification deleted' });
});

