import { asyncHandler } from '../utils/asyncHandler.js';

export const profile = asyncHandler(async (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, studentId: req.user.studentId });
});
