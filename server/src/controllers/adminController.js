// server/src/controllers/adminController.js
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";

/* -------------------------------------------
   ✅ Get Single Admin by ID
------------------------------------------- */
export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id).select(
    "name email role status adminId createdAt updatedAt adminMeta avatar"
  );

  if (!admin || admin.role !== "admin") {
    res.status(404);
    throw new Error("Admin not found");
  }

  res.json(admin);
});

/* -------------------------------------------
   ✅ Get Latest Admin ID
------------------------------------------- */
// ✅ getLatestAdminId (Full Safe Debug Version)
export const getLatestAdminId = async (req, res) => {
  console.log("📡 [getLatestAdminId] Request received...");

  try {
    // 1️⃣ Verify that User model exists
    if (!User) {
      console.error("❌ User model is undefined!");
      return res.status(500).json({
        success: false,
        message: "User model not loaded.",
      });
    }

    // 2️⃣ Query DB for the latest admin
    const lastAdmin = await User.findOne({ role: "admin" })
      .sort({ createdAt: -1 })
      .select("adminId createdAt");

    console.log("🧩 lastAdmin query result:", lastAdmin);

    // 3️⃣ Handle case when no admin exists yet
    if (!lastAdmin) {
      console.log("⚠️ No admin found — returning default ID.");
      return res.status(200).json({
        success: true,
        lastId: "GACADM000",
        nextId: "GACADM001",
        note: "No admin found, default values returned.",
      });
    }

    // 4️⃣ Safely compute next ID
    const lastId = lastAdmin.adminId || "GACADM000";
    const match = lastId.match(/\d+$/);
    const nextNumber = match ? parseInt(match[0]) + 1 : 1;
    const nextId = `GACADM${String(nextNumber).padStart(3, "0")}`;

    console.log("✅ Computed IDs:", { lastId, nextId });

    return res.status(200).json({
      success: true,
      lastId,
      nextId,
    });
  } catch (error) {
    console.error("💥 [getLatestAdminId] Unexpected Error:");
    console.error(error); // Full stack trace
    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest admin ID",
      error: error.message,
      stack: error.stack,
    });
  }
};


/* -------------------------------------------
   ✅ Add New Admin
------------------------------------------- */
/* ============================================================
   ✅ Add New Admin (with Permissions, Department & Avatar)
============================================================ */
export const addAdmin = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  // 🧩 Parse adminMeta safely (department, permissions)
  let adminMeta = {};
  try {
    if (req.body.adminMeta) {
      adminMeta =
        typeof req.body.adminMeta === "string"
          ? JSON.parse(req.body.adminMeta)
          : req.body.adminMeta;
    }
  } catch (error) {
    console.warn("⚠️ Invalid adminMeta JSON:", req.body.adminMeta);
    adminMeta = {};
  }

  const profilePhoto = req.file ? `/uploads/${req.file.filename}` : "";

  // 🔍 Check if admin already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: "User with this email already exists",
    });
  }

  // 🧮 Generate next Admin ID (GACADM###)
  const lastAdmin = await User.findOne({ role: "admin" })
    .sort({ createdAt: -1 })
    .select("adminId");

  let nextNumber = 1;
  if (lastAdmin?.adminId) {
    const match = lastAdmin.adminId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }

  const adminId = `GACADM${String(nextNumber).padStart(3, "0")}`;

  // 🔐 Generate secure random temporary password (plain text here!)
  const tempPassword = Math.random().toString(36).slice(-8) || "GAC@1234TEMP";

  // ⚡️ Create new admin — let Mongoose pre-save hook hash the password
  const admin = await User.create({
    name: name?.trim(),
    email: email?.trim().toLowerCase(),
    password: tempPassword, // ✅ raw password — not hashed manually!
    role: "admin",
    adminId,
    emailVerified: false,
    status: "active",
    avatar: profilePhoto,
    adminMeta: {
      department: adminMeta.department?.trim() || "",
      permissions: Array.isArray(adminMeta.permissions)
        ? adminMeta.permissions
        : [],
    },
  });

  // 📧 Send welcome email with credentials
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f766e;">Welcome to GreenArc LMS Admin Team</h1>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been successfully added as an <strong>Administrator</strong> on the GreenArc LMS platform.</p>
      <p>Here are your temporary login credentials:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Admin ID:</strong> ${adminId}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <p><strong>Note:</strong> Please log in and update your password immediately for security reasons.</p>
      <p>If you did not request this account, please contact the super admin.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ccc;">
      <p style="font-size: 12px; color: #777;">GreenArc Commune LMS Team</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to GreenArc LMS Admin Team",
      html,
      text: `Welcome to GreenArc LMS Admin Team.
      Your Admin ID: ${adminId}, Email: ${email}, Temporary Password: ${tempPassword}.
      Please log in and change your password immediately.`,
    });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    await User.findByIdAndDelete(admin._id);
    throw new Error("Failed to send welcome email. Admin not created.");
  }

  res.status(201).json({
    message: "✅ Admin created successfully. Credentials sent via email.",
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      adminId: admin.adminId,
      role: admin.role,
      department: admin.adminMeta?.department,
      permissions: admin.adminMeta?.permissions,
      avatar: admin.avatar,
      createdAt: admin.createdAt,
    },
  });
});


/* -------------------------------------------
   ✅ List All Students
------------------------------------------- */
export const listStudents = asyncHandler(async (req, res) => {
  // 1️⃣ Get all students
  const students = await User.find({ role: "student" }).select("-password");

  // 2️⃣ Get all enrollments and populate course
  const enrollments = await Enrollment.find()
    .populate("course", "title _id")
    .populate("user", "_id");

  // 3️⃣ Merge course info into each student
  const enrichedStudents = students.map((student) => {
    const enrolled = enrollments.find(
      (enr) => enr.user && enr.user._id.toString() === student._id.toString()
    );
    return {
      ...student.toObject(),
      course: enrolled?.course || null, // attach course object (title + _id)
    };
  });

  res.json(enrichedStudents);
});


/* -------------------------------------------
   ✅ Create Student + Auto Enroll
------------------------------------------- */
export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, course, dob, password } = req.body;

  // 🧩 Validation
  if (!name || !email || !course)
    return res.status(400).json({ message: "Missing required fields (name, email, or course)" });

  // 🎯 Find course by ID or title
  const selectedCourse = await Course.findOne({
    $or: [{ _id: course }, { title: course }],
  });
  if (!selectedCourse)
    return res.status(404).json({ message: "Selected course not found" });

  // 🚫 Prevent duplicate student emails
  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "Email already registered" });

  // 🔢 Auto-generate Student ID in format: GACSTD000001
  const lastStudent = await User.findOne({ role: "student" })
    .sort({ createdAt: -1 })
    .select("studentId");
    
   const BASE_ID = 678900;
  let nextNumber = BASE_ID+1;
  if (lastStudent?.studentId) {
    const match = lastStudent.studentId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }

  const newStudentId = `GACSTD${String(nextNumber).padStart(6, "0")}`;

  // 🔐 Create new student
  const newStudent = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone,
    dob,
    role: "student",
    studentId: newStudentId,
    password,
    status: "active",
  });

  // 🧮 Auto enroll the student
  await Enrollment.create({
    user: newStudent._id,
    course: selectedCourse._id,
    progress: 0,
  });

  res.status(201).json({
    message: "Student created and enrolled successfully",
    student: {
      id: newStudent._id,
      name: newStudent.name,
      email: newStudent.email,
      phone: newStudent.phone,
      studentId: newStudent.studentId,
      course: selectedCourse.title,
      status: newStudent.status,
      createdAt: newStudent.createdAt,
    },
  });
});


/* -------------------------------------------
   ✅ Update Student Status
------------------------------------------- */
export const updateStudentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const student = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).select("-password");

  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

/* -------------------------------------------
   ✅ Delete Student
------------------------------------------- */
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await User.findOneAndDelete({
    _id: req.params.id,
    role: "student", // ensures you’re deleting a student, not an admin
  });

  if (!student) {
    res.status(404);
    throw new Error("Student not found or already deleted");
  }

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
    studentId: student._id,
  });
});


/* -------------------------------------------
   ✅ Analytics Dashboard
------------------------------------------- */
export const analytics = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: "student" });
  const activeStudents = await User.countDocuments({
    role: "student",
    status: "active",
  });
  const totalCourses = await Course.countDocuments();
  const activeCourses = await Course.countDocuments({ published: true });
  const totalEnrollments = await Enrollment.countDocuments();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const enrollmentsByMonth = await Enrollment.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const popularCourses = await Enrollment.aggregate([
    { $group: { _id: "$course", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    { $project: { title: "$course.title", enrollments: "$count" } },
  ]);

  const categoryStats = await Course.aggregate([
    { $match: { published: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    totalStudents,
    activeStudents,
    totalCourses,
    activeCourses,
    totalEnrollments,
    enrollmentsByMonth,
    popularCourses,
    categoryStats,
  });
});
