// server/src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Enrollment } from "./Enrollment.js";
import {
  ALLOWED_PERMISSIONS,
  SUPERADMIN_PERMISSIONS,
} from "../constants/permissions.js";

/* ============================================================
   🧠 USER SCHEMA
   Supports: Students & Admins
   Includes: Auto-ID, password history, cleanup hooks
============================================================ */
const userSchema = new mongoose.Schema(
  {
    /* 🔹 Basic Info */
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      validate: {
        validator: (v) => /^[0-9]{10}$/.test(v),
        message: "Phone number must be a valid 10-digit number",
      },
    },

    password: { type: String, required: true, select: false, minlength: 6 },
    /* 🔹 Role Management */
    role: {
      type: String,
      enum: ["student", "admin", "superadmin"],
      default: "student",
    },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    /* 🔹 Common Fields */
    aadharNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: (v) => /^[0-9]{12}$/.test(v),
        message: "Aadhar number must be a 12-digit numeric string",
      },
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "demo"],
      default: "demo",
    },

    /* 🔹 Identity IDs */
    studentId: { type: String, unique: true, sparse: true },
    adminId: { type: String, unique: true, sparse: true },

    /* 🔹 Admin Metadata */
    adminMeta: {
      department: { type: String },
      permissions: {
        type: mongoose.Schema.Types.Mixed, // store as { dashboard: true, courses: false, ... }
        default: {},
      },
    },

    /* 🔹 Student Details */
    course: { type: String },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    dob: Date,
    avatar: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },

    /* 🔹 Security Fields */
    resetOtpHash: { type: String, select: false },
    resetOtpExpires: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date },
    passwordHistory: [{ type: String, select: false }],
    lastPasswordChange: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/* ============================================================
   🧩 PRE-SAVE HOOKS
============================================================ */
userSchema.pre("save", async function (next) {
  // ✅ Auto-generate Student ID
  if (this.isNew && this.role === "student" && !this.studentId) {
    const lastStudent = await this.constructor
      .findOne({ role: "student" })
      .sort({ createdAt: -1 })
      .select("studentId");

    const base = 202500; // base series
    let nextNumber = base + 1;

    if (lastStudent?.studentId) {
      const match = lastStudent.studentId.match(/\d+$/);
      if (match) {
        const lastNumber = parseInt(match[0], 10);
        nextNumber = Math.max(lastNumber + 1, base + 1);
      }
    }

    this.studentId = `GACSTD${String(nextNumber).padStart(6, "0")}`;
  }

  // ✅ Auto-generate Admin ID
  if (this.isNew && this.role === "admin" && !this.adminId) {
    const lastAdmin = await this.constructor
      .findOne({ role: "admin", adminId: { $exists: true } })
      .sort({ createdAt: -1 })
      .select("adminId")
      .lean();

    let nextNumber = 1;
    if (lastAdmin?.adminId) {
      const match = lastAdmin.adminId.match(/\d+$/);
      if (match) nextNumber = parseInt(match[0], 10) + 1;
    }
    this.adminId = `GACADM${String(nextNumber).padStart(3, "0")}`;
  }

  // ✅ Hash password + manage password history
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
  // inside userSchema.pre("save", async function(next) { ... })
  function sanitizePermissions(perms) {
    if (!perms || typeof perms !== "object") return {};
    return Object.keys(perms).reduce((acc, k) => {
      if (ALLOWED_PERMISSIONS.includes(k)) acc[k] = !!perms[k];
      return acc;
    }, {});
  }

  // after existing auto-id and password logic, add:
  if (this.isModified("adminMeta") && this.adminMeta?.permissions) {
    this.adminMeta.permissions = sanitizePermissions(
      this.adminMeta.permissions
    );
  }

  // auto-grant for superadmin
  if (this.isNew && this.role === "superadmin") {
    this.adminMeta = this.adminMeta || {};
    this.adminMeta.permissions = { ...SUPERADMIN_PERMISSIONS };
  }
});

/* ============================================================
   🧩 INSTANCE METHODS
============================================================ */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isPasswordReused = async function (newPassword) {
  for (const oldHash of this.passwordHistory) {
    if (await bcrypt.compare(newPassword, oldHash)) return true;
  }
  return false;
};

/* ============================================================
   🧹 AUTO-CLEANUP HOOK (when user is deleted)
============================================================ */
userSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  try {
    const deleted = await Enrollment.deleteMany({ user: doc._id });
    if (deleted.deletedCount > 0) {
      console.log(
        `🧹 Cleaned ${deleted.deletedCount} enrollments of deleted user ${doc.email}`
      );
    }
  } catch (err) {
    console.error("❌ Enrollment cleanup failed:", err.message);
  }
});

userSchema.methods.hasPermission = function (perm) {
  if (this.role === "superadmin") return true;
  return !!(
    this.adminMeta &&
    this.adminMeta.permissions &&
    this.adminMeta.permissions[perm]
  );
};

userSchema.methods.canAssignPermission = function (perm) {
  // who can assign this permission? only superadmin can assign manageAdmins, else admin can assign subset
  if (this.role === "superadmin") return true;
  // example policy: normal admin cannot grant 'manageAdmins' or 'superSensitive' perms
  if (perm === "manageAdmins") return false;
  // other perms: allow if admin has them
  return this.hasPermission(perm);
};

/* ============================================================
   ⚙️ INDEXES
============================================================ */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

/* ============================================================
   ✅ EXPORT MODEL
============================================================ */
export const User = mongoose.model("User", userSchema);
