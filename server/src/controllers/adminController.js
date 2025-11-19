// server/src/controllers/adminController.js
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/email.js";
import crypto from "crypto";
import { validateAndCleanEnrollments } from "../utils/cleanupEnrollments.js";

/* ============================================================
   Helper utilities (DOB + Aadhar robust handling)
   - parseDOB: accepts Date, "DD/MM/YYYY", "YYYY-MM-DD", ISO string
   - cleanAadhar: always returns 12-digit string or throws
   - safeTrim: safe trim helper
   ============================================================ */

function safeTrim(val) {
  if (val === undefined || val === null) return val;
  if (typeof val === "string") return val.trim();
  // numbers -> string
  return String(val).trim();
}

/**
 * parseDOB
 * Accepts:
 *  - Date object (valid)
 *  - "DD/MM/YYYY" (e.g. 25/12/2000)
 *  - "YYYY-MM-DD" or ISO date strings
 * Returns JS Date instance or throws Error on invalid
 */
function parseDOB(dobInput) {
  if (!dobInput && dobInput !== 0) return null;

  // If already a Date
  if (dobInput instanceof Date) {
    if (isNaN(dobInput.getTime())) throw new Error("Invalid date");
    return dobInput;
  }

  // If number (timestamp)
  if (typeof dobInput === "number") {
    const d = new Date(dobInput);
    if (isNaN(d.getTime())) throw new Error("Invalid date");
    return d;
  }

  // If string: try "DD/MM/YYYY"
  if (typeof dobInput === "string") {
    const s = dobInput.trim();
    // DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const m1 = s.match(ddmmyyyy);
    if (m1) {
      const day = parseInt(m1[1], 10);
      const month = parseInt(m1[2], 10);
      const year = parseInt(m1[3], 10);
      // basic ranges
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error("Invalid date parts");
      }
      const parsed = new Date(year, month - 1, day);
      // Check that date components match (to avoid fallen-through invalid dates like 31 Feb)
      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
      ) {
        throw new Error("Invalid date");
      }
      return parsed;
    }

    // Try ISO / YYYY-MM-DD or Date.parse
    const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(s);
    if (isoMatch) {
      const parsed = new Date(s);
      if (isNaN(parsed.getTime())) throw new Error("Invalid date");
      return parsed;
    }

    // As a last resort try Date.parse
    const fallback = new Date(s);
    if (!isNaN(fallback.getTime())) return fallback;

    throw new Error("Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD");
  }

  throw new Error("Unsupported DOB format");
}

/**
 * cleanAadhar
 * - Accepts number or string
 * - Returns 12-digit string (keeps leading zeros)
 * - Removes non-digit characters
 * - Throws error if not exactly 12 digits
 */
function cleanAadhar(aadharInput) {
  if (aadharInput === undefined || aadharInput === null || aadharInput === "")
    return null;

  // Convert to string and strip non-digit chars
  let s = String(aadharInput).replace(/\D/g, "").trim();

  if (!/^\d{12}$/.test(s)) {
    throw new Error("Aadhar number must be a 12-digit numeric string");
  }

  return s;
}

/* -------------------------------------------
   ✅ Get Admin by ID
------------------------------------------- */
export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await User.findOne({
    _id: req.params.id,   // removed role filter
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
      department: "",
    };
  } else if (!Array.isArray(admin.adminMeta.permissions)) {
    admin.adminMeta.permissions = admin.adminMeta.permissions
      ? [admin.adminMeta.permissions]
      : [];
  }

  res.json({
    success: true,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      adminId: admin.adminId,
      role: admin.role,
      status: admin.status,
      adminMeta: admin.adminMeta,
      createdAt: admin.createdAt,
      avatar: admin.avatar,
    },
  });
});


/* -------------------------------------------
   ✅ Get Latest Admin ID
------------------------------------------- */
export const getLatestAdminId = asyncHandler(async (req, res) => {
  const lastAdmin = await User.findOne({ role: "admin" })
    .sort({ createdAt: -1 })
    .select("adminId");

  let nextNumber = 1;
  if (lastAdmin?.adminId) {
    const match = lastAdmin.adminId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }

  res.json({ nextId: `GACADM${String(nextNumber).padStart(3, "0")}` });
});

/* -------------------------------------------
   ✅ Add New Admin
------------------------------------------- */
export const addAdmin = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    adminMeta,
    aadharNumber,
    gender,
    paymentStatus,
  } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please include all required fields");
  }

  // Check if admin already exists
  const adminExists = await User.findOne({ email });
  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  // Get the latest admin ID
  // Note: In original flow there was a call to getLatestAdminId route handler
  // Here we simply compute the adminId similarly so we don't rely on an HTTP call.
  const lastAdmin = await User.findOne({ role: "admin" })
    .sort({ createdAt: -1 })
    .select("adminId")
    .lean();
  let nextNumber = 1;
  if (lastAdmin?.adminId) {
    const match = lastAdmin.adminId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0], 10) + 1;
  }
  const adminId = `GACADM${String(nextNumber).padStart(3, "0")}`;

  // Clean and validate aadhar if provided
  let cleanAadharNumber = undefined;
  try {
    if (
      aadharNumber !== undefined &&
      aadharNumber !== null &&
      aadharNumber !== ""
    ) {
      cleanAadharNumber = cleanAadhar(aadharNumber);
    }
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }

  // Create admin
  const admin = await User.create({
    name,
    email,
    password,
    adminId,
    role: "admin",
    aadharNumber: cleanAadharNumber,
    gender: gender || "male",
    paymentStatus: paymentStatus || "Demo",
    adminMeta: {
      ...adminMeta,
      permissions: Array.isArray(adminMeta?.permissions)
        ? adminMeta.permissions
        : [],
    },
    emailVerified: true,
    status: "active",
  });

  // Generate token (kept as in original; assumes generateToken exists elsewhere)
  const token =
    typeof generateToken === "function" ? generateToken(admin._id) : undefined;

  // Send welcome email
  try {
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetOtpHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetOtpHash = resetOtpHash;
    admin.resetOtpExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await admin.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: admin.email,
      subject: "Welcome to Admin Panel - Set Your Password",
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
      `,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }

  res.status(201).json({
    success: true,
    admin: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      adminId: admin.adminId,
      role: admin.role,
      aadharNumber: admin.aadharNumber,
      gender: admin.gender,
      paymentStatus: admin.paymentStatus,
      adminMeta: admin.adminMeta,
    },
    token,
  });
});

/* -------------------------------------------
   ✅ List Students
------------------------------------------- */
export const listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" })
    .select(
      "-password -passwordHistory -__v -resetOtpHash -resetOtpExpires -passwordResetToken -passwordResetExpires"
    )
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
  const {
    name,
    email,
    phone,
    course,
    dob,
    password,
    aadharNumber,
    gender,
    paymentStatus,
  } = req.body;

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

  // Validate and parse DOB (if provided)
  let parsedDOB = null;
  try {
    if (dob !== undefined && dob !== null && dob !== "") {
      parsedDOB = parseDOB(dob);
    }
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  // Validate and clean Aadhar number (if provided)
  let cleanAadharNumber = undefined;
  try {
    if (
      aadharNumber !== undefined &&
      aadharNumber !== null &&
      aadharNumber !== ""
    ) {
      cleanAadharNumber = cleanAadhar(aadharNumber);
    }
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const tempPassword = password || Math.random().toString(36).slice(-8);

  // ✅ No manual studentId here — auto generated by model
  const newStudent = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : undefined,
    course: selectedCourse._id,
    dob: parsedDOB,
    password: tempPassword, // RAW password here
    role: "student",
    aadharNumber: cleanAadharNumber,
    gender: gender || "male",
    paymentStatus: paymentStatus?.toLowerCase() || "demo",
    emailVerified: true,
    status: "active",
  });

  await Enrollment.create({
    user: newStudent._id,
    course: selectedCourse._id,
    progress: 0,
  });

  // ✉️ Send welcome email
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 700px; margin: auto; background: #ffffff; padding: 20px;">

  <!-- HEADER -->
  <div style="text-align: center; padding: 20px 0;">
    <img src="http://192.168.1.68:5000/assets/GreenArcLogo.png" alt="GreenArc Commune Logo" style="height: 70px;" />
    <h1 style="color: #14532d; font-size: 24px; margin-top: 10px;">Welcome to GreenArc LMS</h1>
  </div>

  <!-- GREETING -->
  <p style="font-size: 16px; color: #111827;">
    Dear <strong>${name}</strong>,
  </p>

  <p style="font-size: 15px; color: #374151; line-height: 1.6;">
    Welcome to the GreenArc Commune LMS. We’re thrilled to have you join our professional learning 
    community built around Wealth, Wisdom, and Wellness. Below are your secure login credentials:
  </p>

  <!-- CREDENTIALS TABLE -->
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb;"><strong>Student ID</strong></td>
      <td style="border: 1px solid #d1d5db; padding: 10px;">${newStudent.studentId}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb;"><strong>Email</strong></td>
      <td style="border: 1px solid #d1d5db; padding: 10px;">${email}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 10px; background: #f9fafb;"><strong>Temporary Password</strong></td>
      <td style="border: 1px solid #d1d5db; padding: 10px;">${tempPassword}</td>
    </tr>
  </table>

  <p style="font-size: 15px; color: #374151;">
    Please log in using these credentials and ensure that you update your password upon first login.
  </p>

  <!-- LOGIN BUTTON -->
  <div style="text-align: center; margin: 25px 0;">
    <a href="https://lms.greenarccommune.com/login"
       style="background-color: #166534; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
      Access Your Account
    </a>
  </div>

  <!-- TRADING RULES SECTION -->
  <h2 style="color: #111827; font-size: 22px; margin-top: 40px; text-decoration: underline;">Before You Begin</h2>

  <p style="font-size: 15px; color: #374151; line-height: 1.6;">
    Please take a few minutes to read and follow the <strong>10 Golden Rules</strong> that guide every learner in the GreenArc LMS.
    These are essential for discipline, consistency, and long-term success.
  </p>

  <!-- DISCLAIMER RED BOX -->
  <div style="background: #ff0000; padding: 10px; border-radius: 4px; margin-top: 20px;">
    <p style="margin: 0; color: white; font-size: 15px; font-weight: bold;">
      ⚠️ DISCLAIMER
    </p>
  </div>

  <p style="background: #ff0000; color: white; padding: 10px; margin: 0; font-size: 15px; line-height: 1.6;">
    Trading in financial markets involves high risk and may result in loss of capital.<br>
    All live sessions and setups shared within the LMS are for educational purposes only.<br>
    GreenArc Commune and its mentors do not provide financial advice or guarantees of profit.<br>
    Trade only with money you can afford to lose, and always take full responsibility for your decisions.
  </p>

  <!-- MAIN RULES -->
  <h2 style="font-size: 24px; color: #111827; text-decoration: underline; margin-top: 35px;">Main Rules:</h2>

  <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">1 - Position Sizing:</p>
  <p style="color: #374151;">Always start with 0.01 lot per $100 of trading capital.<br>This ensures consistent risk management and longevity in the market.</p>

  <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">2 - Daily Risk Cap:</p>
  <p style="color: #374151;">Never risk more than 4% of your capital in a single trading day.<br>Once you hit this limit, stop trading and review your trades.</p>

  <!-- SUPPORTING RULES -->
  <h2 style="font-size: 24px; color: #111827; text-decoration: underline; margin-top: 35px;">Supporting Rules:</h2>

  <p><strong>3- Follow the Live Session Setup:</strong><br>
     Enter trades only when the setup is clearly explained — avoid impulsive entries.</p>

  <p><strong>4- Use Stop Loss (SL) Strictly:</strong><br>
     Every trade must include SL as per the setup. No exceptions.</p>

  <p><strong>5- Journal Every Trade:</strong><br>
     Maintain entry, SL, TP, reason, and emotion level. Builds consistency.</p>

  <p><strong>6- No Revenge Trading:</strong><br>
     Losses are normal. Avoid increasing lot size emotionally.</p>

  <p><strong>7- Stay Emotionally Neutral:</strong><br>
     Don’t get excited after wins or frustrated after losses. Consistency > Emotion.</p>

  <p><strong>8- Respect the Community Rules:</strong><br>
     No recording, self-promotion, external links, or trade signals outside GreenArc.</p>

  <p><strong>9- Use Proper Internet and Chart Setup:</strong><br>
     Ensure MT4/MT5, internet, and timezone are correct.</p>

  <p><strong>10- Be Punctual and Present:</strong><br>
     Join on time, keep charts open, avoid multitasking.</p>

  <!-- VIDEO LINK -->
  <h3 style="margin-top: 35px; font-size: 18px;">WATCH FULL VIDEO TO UNDERSTAND THE RULES</h3>
  <p>
    <a href="https://drive.google.com/file/d/14nPn41SoNGbDi74xbuJXE8UzEwS0-mga/view?usp=drive_link" 
       style="color: #2563eb; font-weight: bold;">Click Here</a>
  </p>

  <!-- SECOND DISCLAIMER RED -->
  <div style="background: #ff0000; padding: 10px; border-radius: 4px; margin-top: 30px;">
    <p style="margin: 0; color: white; font-size: 15px; font-weight: bold;">⚠️ DISCLAIMER</p>
  </div>

  <p style="background: #ff0000; color: white; padding: 10px; margin: 0; font-size: 15px; line-height: 1.6;">
    GreenArc Commune provides education and mentorship purely for learning purposes.<br>
    We are not SEBI-registered advisors and do not offer investment advice or tips.<br>
    All information shared is educational only. Participants are fully responsible for their decisions.<br>
    Past performance does not guarantee future results.
  </p>

  <!-- REQUIRED CONFIRMATION -->
  <h3 style="font-size: 20px; margin-top: 35px; color: #14532d;">✅ Required Confirmation</h3>

  <p style="font-size: 15px; color: #374151;">
    To continue your LMS access, please <strong>reply to this email</strong> with the statement below:
  </p>

  <p style="font-size: 18px; text-align: center; font-weight: bold; margin: 20px 0;">
    "I understand that all Green Arc Commune sessions are for educational purposes only and I take full responsibility for my trading decisions."
  </p>

  <p style="font-size: 14px; color: #6b7280;">
    Your reply confirms your acknowledgment and keeps you compliant with our mentorship policy.
  </p>

  <!-- FOOTER -->
  <p style="font-size: 15px; color: #374151; margin-top: 30px;">
    Let’s build a disciplined trading mindset and grow together — one setup at a time.
  </p>

  <p style="font-size: 14px; color: #111827;">
    Warm regards,<br>
    <strong>Team Green Arc Commune</strong><br />
    support@greenarccommune.com
    Instagram: <a href="https://www.instagram.com/greenarccommune/" style="color: #2563eb;">@greenarccommune</a><br />
    YouTube: <a href="https://www.youtube.com/@GreenArcCommune" style="color: #2563eb;">GreenArc Commune</a><br />
    Wealth | Wisdom | Wellness
  </p>

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

  const cleanStudent = await User.findById(newStudent._id).select(
    "-password -passwordHistory -__v -resetOtpHash -resetOtpExpires -passwordResetToken -passwordResetExpires"
  );

  res.status(201).json({
    message: "Student created successfully",
    student: cleanStudent,
  });
});

/* -------------------------------------------
   ✅ Get Single Student by ID (Full Details)
------------------------------------------- */
export const getStudentById = asyncHandler(async (req, res) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: "student",
  })
    .select(
      "name email phone studentId course dob aadharNumber gender paymentStatus status avatar createdAt enrolledCourses"
    )
    .populate({
      path: "enrolledCourses",
      select: "title category difficulty",
    });

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Load single enrollment course
  const enrollment = await Enrollment.findOne({ user: student._id })
    .populate("course", "title _id category difficulty")
    .lean();

  const response = {
    ...student.toObject(),
    course: enrollment?.course || null,
  };

  res.status(200).json(response);
});

/* ============================================================
   ✅ Update Student
   =========================================================== */
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let {
    name,
    email,
    phone,
    course,
    dob,
    aadharNumber,
    gender,
    paymentStatus,
    status,
  } = req.body;

  // Find the student
  const student = await User.findById(id);
  if (!student || student.role !== "student") {
    res.status(404);
    throw new Error("Student not found");
  }

  // Format/parse date if provided
  let parsedDOB = null;
  if (dob !== undefined && dob !== null && dob !== "") {
    try {
      parsedDOB = parseDOB(dob);
    } catch (err) {
      res.status(400);
      throw new Error(
        err.message ||
          "Invalid date format. Please use DD/MM/YYYY or YYYY-MM-DD"
      );
    }
  }

  // Validate Aadhar number if provided
  let cleanAadharNumber = undefined;
  if (
    aadharNumber !== undefined &&
    aadharNumber !== null &&
    aadharNumber !== ""
  ) {
    try {
      cleanAadharNumber = cleanAadhar(aadharNumber);
    } catch (err) {
      res.status(400);
      throw new Error(err.message);
    }
  }

  // Check if email is already taken by another user
  if (email && email !== student.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: id } });
    if (emailExists) {
      res.status(400);
      throw new Error("Email is already in use");
    }
  }

  // Update student fields
  student.name = name || student.name;
  student.email = email || student.email;
  student.phone = phone || student.phone;
  student.course = course || student.course;
  // Only assign parsed DOB if provided; otherwise keep existing
  if (parsedDOB !== null) student.dob = parsedDOB;
  student.aadharNumber = cleanAadharNumber || student.aadharNumber;
  student.gender = gender || student.gender;
  student.paymentStatus = paymentStatus || student.paymentStatus;
  student.status = status || student.status;

  // Rest of the function remains the same...
  // [Previous code for course update, profile photo upload, etc.]

  // Save and return updated student
  await student.save();

  const updatedStudent = await User.findById(id).select(
    "-password -passwordHistory -__v -resetOtpHash -resetOtpExpires -passwordResetToken -passwordResetExpires"
  );

  res.status(200).json({
    message: "Student updated successfully",
    student: updatedStudent,
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
        <strong>Student ID:</strong> ${student.studentId || "N/A"}
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
