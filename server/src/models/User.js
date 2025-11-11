// server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 6 },

    role: { type: String, enum: ["student", "admin"], default: "student" },

    // ✅ FINAL FIX — no duplicate index warning now
    studentId: { type: String },
    adminId: { type: String },

    adminMeta: {
      department: { type: String },
      permissions: [{ type: String }],
    },

    course: { type: String },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    dob: Date,
    status: { type: String, enum: ["active", "banned"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    avatar: { type: String, default: "" },

    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date },
    passwordHistory: [{ type: String, select: false }],
    lastPasswordChange: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // ✅ Auto-generate Student ID
  if (this.isNew && this.role === "student" && !this.studentId) {
    const lastStudent = await this.constructor
      .findOne({ role: "student" })
      .sort({ createdAt: -1 })
      .select("studentId");

    const defaultBase = 202500; // Our starting point
    let nextNumber = defaultBase + 1; // First student gets 202501
    
    // Only try to find a higher number if we have existing students
    if (lastStudent?.studentId) {
      const match = lastStudent.studentId.match(/\d+$/);
      if (match) {
        const lastNumber = parseInt(match[0], 10);
        nextNumber = Math.max(lastNumber + 1, defaultBase + 1);
      }
    }

    this.studentId = `GACSTD${String(nextNumber).padStart(6, "0")}`;
  }

  // ✅ Auto-generate Admin ID
  if (this.isNew && this.role === "admin" && !this.adminId) {
    let nextNumber = 1;
    const lastAdmin = await this.constructor
      .findOne({ role: "admin", adminId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select("adminId")
      .lean();

    if (lastAdmin?.adminId) {
      const match = lastAdmin.adminId.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0]) + 1;
    }
    this.adminId = `GACADM${String(nextNumber).padStart(3, "0")}`;
  }

  // ✅ Hash password + manage history
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(this.password, salt);

    if (!Array.isArray(this.passwordHistory)) this.passwordHistory = [];
    if (this.passwordHistory.length >= 5) this.passwordHistory.shift();

    this.passwordHistory.push(hashed);
    this.password = hashed;
    this.lastPasswordChange = Date.now();
  }

  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isPasswordReused = async function (newPassword) {
  for (const oldHash of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, oldHash)) return true;
  }
  return false;
};

// ⚡ Clean, optimized indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ adminId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.model("User", userSchema);