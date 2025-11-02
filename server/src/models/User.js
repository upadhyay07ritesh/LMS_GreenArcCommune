import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    studentId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['active', 'banned'], default: 'active' },
    avatar: { type: String }, // URL to profile image
    emailVerified: { type: Boolean, default: false },
    // OTP reset fields
    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export const User = mongoose.model('User', userSchema);
