export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  if (req.user.status !== 'active') {
    return res.status(403).json({ message: 'Your account is not active' });
  }
  next();
};