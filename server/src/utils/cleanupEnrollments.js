// utils/cleanupEnrollments.js
import { Enrollment } from "../models/Enrollment.js";

/**
 * Find only valid enrollments (user exists).
 * Optionally clean up invalid ones automatically.
 */
export const validateAndCleanEnrollments = async (autoDelete = false) => {
  const enrollments = await Enrollment.find().populate("user", "_id name email status");

  const valid = [];
  const invalidIds = [];

  for (const e of enrollments) {
    if (e.user) {
      valid.push(e);
    } else {
      invalidIds.push(e._id);
    }
  }

  // 🧹 Optionally delete invalid ones
  if (autoDelete && invalidIds.length > 0) {
    await Enrollment.deleteMany({ _id: { $in: invalidIds } });
    console.log(`🧹 Removed ${invalidIds.length} invalid enrollments`);
  }

  return valid;
};
