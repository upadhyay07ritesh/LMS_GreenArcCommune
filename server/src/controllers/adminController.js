// server/src/controllers/adminController.js
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/email.js";
import crypto from 'crypto';
import { validateAndCleanEnrollments } from "../utils/cleanupEnrollments.js";
/* -------------------------------------------
   ✅ Get Admin by ID
------------------------------------------- */
export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await User.findOne({ 
    _id: req.params.id, 
    role: "admin" 
  }).select(
    "-password -passwordHistory -__v -resetOtpHash -resetOtpExpires -passwordResetToken -passwordResetExpires"
  );

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Ensure adminMeta exists with proper structure
  if (!admin.adminMeta) {
    admin.adminMeta = {
      permissions: [],
      department: ""
    };
  } else if (!Array.isArray(admin.adminMeta.permissions)) {
    admin.adminMeta.permissions = admin.adminMeta.permissions 
      ? [admin.adminMeta.permissions] 
      : [];
  }

  res.json({
    success: true,
    admin
  });
});

/* -------------------------------------------
   ✅ Get Latest Admin ID
------------------------------------------- */
export const getLatestAdminId = asyncHandler(async (req, res) => {
  const lastAdmin = await User.findOne({ role: 'admin' })
    .sort({ createdAt: -1 })
    .select('adminId');
  
  let nextNumber = 1;
  if (lastAdmin?.adminId) {
    const match = lastAdmin.adminId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }
  
  res.json({ nextId: `GACADM${String(nextNumber).padStart(3, '0')}` });
});

/* -------------------------------------------
   ✅ Add New Admin
------------------------------------------- */
export const addAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, adminMeta } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please include all required fields');
  }

  // Check if admin already exists
  const adminExists = await User.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error('Admin already exists');
  }

  // Get the latest admin ID
  const latestIdRes = await getLatestAdminId({}, { json: (data) => data });
  const adminId = latestIdRes.nextId;

  // Create admin
  const admin = await User.create({
    name,
    email,
    password,
    adminId,
    role: 'admin',
    adminMeta: {
      ...adminMeta,
      permissions: Array.isArray(adminMeta?.permissions) 
        ? adminMeta.permissions 
        : []
    },
    emailVerified: true,
    status: 'active'
  });

  // Generate token
  const token = generateToken(admin._id);

  // Send welcome email
  try {
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetOtpHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    admin.resetOtpHash = resetOtpHash;
    admin.resetOtpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await admin.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await sendEmail({
      to: admin.email,
      subject: 'Welcome to Admin Panel - Set Your Password',
      html: `
        <div>
          <h2>Welcome to Admin Panel</h2>
          <p>Hello ${admin.name},</p>
          <p>You have been added as an admin. Please set your password by clicking the link below:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Set Password
          </a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please contact support immediately.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }

  res.status(201).json({
    success: true,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      adminId: admin.adminId,
      role: admin.role,
      adminMeta: admin.adminMeta
    },
    token
  });
});

/* -------------------------------------------
   ✅ List Students
------------------------------------------- */
export const listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" })
    .select("name email studentId status dob avatar")
    .lean();

  // Load enrollments in one go
  const enrollments = await Enrollment.find()
    .populate("course", "title _id category difficulty")
    .lean();

  // Merge enrollments into students
  const enriched = students.map((student) => {
    const enrolled = enrollments.find(
      (e) => e.user?.toString() === student._id.toString()
    );
    return {
      ...student,
      course: enrolled?.course || null,
    };
  });

  // ✅ If no enrollment found, still return student
  res.status(200).json(enriched);
});


/* -------------------------------------------
   ✅ Create Student + Auto ID + Welcome Email
------------------------------------------- */
export const createStudent = asyncHandler(async (req, res) => {
  // Destructure only allowed fields - studentId is auto-generated
  const { name, email, phone, course, dob, password } = req.body;

  if (!name || !email || !course)
    return res.status(400).json({ message: "Missing required fields" });

  const selectedCourse = await Course.findOne({
    $or: [{ _id: course }, { title: course }],
  });
  if (!selectedCourse)
    return res.status(404).json({ message: "Selected course not found" });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "Email already registered" });

  // ✅ No manual studentId here — auto generated by model
  const newStudent = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone,
    dob,
    role: "student",
    password,
    status: "active",
  });

  await Enrollment.create({
    user: newStudent._id,
    course: selectedCourse._id,
    progress: 0,
  });

  // ✉️ Send welcome email
  const html = `
    <div
  style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);"
>
  <!-- Header -->
  <div style="background-color: #14532d; text-align: center; padding: 20px;">
    <img
      src="https://lms.greenarccommune.com/assets/GreenArcLogo.png"
      alt="GreenArc Commune Logo"
      style="height: 70px; margin-bottom: 8px;"
    />
    <h1
      style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px;"
    >
      Welcome to GreenArc LMS
    </h1>
  </div>

  <!-- Body -->
  <div style="padding: 25px 30px;">
    <p style="font-size: 16px; color: #111827;">
      Hi <strong>${name}</strong>,
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.6;">
      Welcome aboard! You’ve been successfully enrolled in
      <strong>${selectedCourse.title}</strong>. We’re thrilled to have you as
      part of the GreenArc learning community.
    </p>

    <!-- Student Details Box -->
    <div
      style="background: #f9fafb; border: 1px solid #d1d5db; padding: 15px 20px; border-radius: 8px; margin: 20px 0;"
    >
      <p style="margin: 0; font-size: 14px; color: #111827;">
        <strong>Student ID:</strong> ${newStudent.studentId}
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #111827;">
        <strong>Email:</strong> ${email}
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #111827;">
        <strong>Temporary Password:</strong> ${password}
      </p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6;">
      Please log in to your account using these credentials and make sure to
      <strong>change your password</strong> after your first login for security
      purposes.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a
        href="https://lms.greenarccommune.com/login"
        style="background-color: #166534; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; letter-spacing: 0.3px;"
      >
        Access Your Account
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      If you didn’t request this enrollment, please ignore this email or contact
      our support team immediately.
    </p>

    <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">
      Warm regards,<br />
      <strong style="color: #14532d;">GreenArc Commune LMS Team</strong><br />
      <span style="font-size: 12px;">Empowering Learning Through Technology</span>
    </p>
  </div>

  <!-- Footer -->
  <div
    style="background-color: #f3f4f6; color: #6b7280; text-align: center; padding: 12px; font-size: 12px;"
  >
    © ${new Date().getFullYear()} GreenArc Commune. All rights reserved.
  </div>
</div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to GreenArc LMS – Your Learning Journey Begins!",
      html,
      text: `Welcome ${name}, your Student ID is ${newStudent.studentId}. Course: ${selectedCourse.title}.`,
    });
  } catch (err) {
    console.error("❌ Student welcome email failed:", err);
  }

  res.status(201).json({
    message: "Student created, enrolled, and email sent 🎉",
    student: newStudent,
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
    role: "student",
  });

  if (!student) return res.status(404).json({ message: "Student not found" });

  // Send deletion email
  const html = `
   <div
  style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);"
>
  <!-- Header -->
  <div style="background-color: #14532d; text-align: center; padding: 20px;">
    <img
      src="https://lms.greenarccommune.com/assets/GreenArcLogo.png"
      alt="GreenArc Commune Logo"
      style="height: 70px; margin-bottom: 8px;"
    />
    <h1
      style="margin: 0; font-size: 22px; color: #ffffff; letter-spacing: 0.5px;"
    >
      Account Deletion Notification
    </h1>
  </div>

  <!-- Body -->
  <div style="padding: 25px 30px;">
    <p style="font-size: 16px; color: #111827;">
      Hello <strong>${student.name}</strong>,
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.6;">
      We’re writing to inform you that your <strong>GreenArc LMS student account</strong> has been
      <span style="color: #b91c1c; font-weight: 600;">deleted</span> from our system.
    </p>

    <!-- Account Details -->
    <div
      style="background: #f9fafb; border: 1px solid #d1d5db; padding: 15px 20px; border-radius: 8px; margin: 20px 0;"
    >
      <p style="margin: 0; font-size: 14px; color: #111827;">
        <strong>Name:</strong> ${student.name}
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #111827;">
        <strong>Email:</strong> ${student.email}
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #111827;">
        <strong>Student ID:</strong> ${student.studentId || 'N/A'}
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #111827;">
        <strong>Deletion Date:</strong> ${new Date().toLocaleDateString()}
      </p>
    </div>

    <p style="font-size: 15px; color: #374151; line-height: 1.6;">
      If you believe this deletion was made in error or wish to reactivate your
      access, please contact our support team immediately.
    </p>

    <!-- Support CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a
        href="mailto:support@greenarccommune.com"
        style="background-color: #166534; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;"
      >
        Contact Support
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      Thank you for being a part of the <strong>GreenArc Commune Learning
      Community</strong>. We wish you continued success in your learning journey.
    </p>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 25px;">
      <strong>Note:</strong> This is an automated message — please do not reply
      directly to this email.
    </p>
  </div>

  <!-- Footer -->
  <div
    style="background-color: #f3f4f6; color: #6b7280; text-align: center; padding: 12px; font-size: 12px;"
  >
    © ${new Date().getFullYear()} GreenArc Commune. All rights reserved.
  </div>
</div>

  `;

  try {
    await sendEmail({
      to: student.email,
      subject: "Your Student Account Has Been Deleted - GreenArc LMS",
      html,
    });
  } catch (error) {
    console.error("Failed to send deletion email:", error);
    // Don't fail the request if email fails
  }

  res.json({ success: true, message: "Student deleted", id: student._id });
});

/* -------------------------------------------
   ✅ Analytics
------------------------------------------- */
export const analytics = asyncHandler(async (req, res) => {
  // 🧹 Clean invalid enrollments before analytics calculation
  await validateAndCleanEnrollments(true); // true = auto-delete invalid ones

  const totalStudents = await User.countDocuments({ role: "student" });
  const activeStudents = await User.countDocuments({
    role: "student",
    status: "active",
  });
  const totalCourses = await Course.countDocuments();
  const activeCourses = await Course.countDocuments({ published: true });
  const totalEnrollments = await Enrollment.countDocuments();
  const uniqueEnrolledStudents = (await Enrollment.distinct("user")).length;

  // 🟢 Enrollment trends
  const enrollmentsByMonth = await Enrollment.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $limit: 6 },
  ]);

  // 🟣 Category stats
  const categoryStats = await Course.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  // 🟡 Popular courses
  const popularCourses = await Enrollment.aggregate([
    { $group: { _id: "$course", enrollments: { $sum: 1 } } },
    {
      $lookup: {
        from: "courses",
        localField: "_id",
        foreignField: "_id",
        as: "course",
      },
    },
    { $unwind: "$course" },
    { $project: { title: "$course.title", enrollments: 1 } },
    { $sort: { enrollments: -1 } },
    { $limit: 5 },
  ]);

  res.json({
    totalStudents,
    activeStudents,
    totalCourses,
    activeCourses,
    totalEnrollments,
    uniqueEnrolledStudents,
    enrollmentsByMonth,
    categoryStats,
    popularCourses,
  });
});