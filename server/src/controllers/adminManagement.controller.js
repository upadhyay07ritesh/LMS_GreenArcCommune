import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/email.js";

/* ============================================================
   ✅ Get Admin by ID with Permissions
============================================================ */
export const getAdminWithPermissions = asyncHandler(async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "admin",
    }).select(
      "-password -passwordHistory -__v -resetOtpHash -resetOtpExpires -passwordResetToken -passwordResetExpires"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Ensure adminMeta exists and has the correct structure
    if (!admin.adminMeta) {
      admin.adminMeta = {
        permissions: [],
        department: "",
      };
    } else if (
      admin.adminMeta.permissions &&
      !Array.isArray(admin.adminMeta.permissions)
    ) {
      // Convert to array if it's not already
      admin.adminMeta.permissions = [admin.adminMeta.permissions];
    } else if (!admin.adminMeta.permissions) {
      admin.adminMeta.permissions = [];
    }

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("❌ Error fetching admin details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin details",
    });
  }
});

/* ============================================================
   ✅ List All Admins
============================================================ */
export const listAdmins = asyncHandler(async (req, res) => {
  try {
    const admins = await User.find({ 
      role: { $in: ["admin", "superadmin"] }
    })
      .select("-password -passwordHistory")
      .sort({ createdAt: -1 });

    res.status(200).json(admins);
  } catch (error) {
    console.error("❌ Error fetching admins:", error);
    res.status(500).json({ message: "Failed to load admins" });
  }
});


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

  // 🔐 Generate secure random temporary password
  const tempPassword = Math.random().toString(36).slice(-8) || "GAC@1234TEMP";
  const finalRole =
    req.body.role === "superadmin" ? "superadmin" : "admin";

  const ALL_PERMISSIONS = [
    "manage_users",
    "manage_courses",
    "manage_admins",
    "manage_live_sessions",
    "view_analytics",
  ];

  const finalPermissions =
    finalRole === "superadmin"
      ? ALL_PERMISSIONS
      : Array.isArray(adminMeta.permissions)
      ? adminMeta.permissions
      : [];

  // 🧱 Create new admin user (model will generate adminId)
  let admin;
  try {
    admin = await User.create({
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      password: tempPassword,
      role: finalRole,
      emailVerified: false,
      status: "active",
      avatar: profilePhoto,
      adminMeta: {
        department: adminMeta.department?.trim() || "",
        permissions: finalPermissions,
      },
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res
        .status(400)
        .json({ message: `Duplicate ${field}. Please use a different value.` });
    }
    throw err;
  }

  // 📧 Send welcome email with credentials
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f766e;">Welcome to GreenArc LMS Admin Team</h1>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have been successfully added as an <strong>Administrator</strong> on the GreenArc LMS platform.</p>
      <p>Here are your temporary login credentials:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p>Your Admin Role: <strong>${finalRole}</strong></p>
        <p><strong>Admin ID:</strong> ${admin.adminId}</p>
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
      Your Admin ID: ${admin.adminId}, Email: ${email}, Temporary Password: ${tempPassword}.
      Please log in and change your password immediately.`,
    });
  } catch (error) {
    console.warn("⚠️ Email send failed, but admin will remain:", error.message);
  }

  // Get the current admin's token from the request
  const currentAdminToken = req.headers.authorization?.split(" ")[1];

  // Exclude sensitive data from the response
  const adminData = {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    adminId: admin.adminId,
    role: admin.role,
    department: admin.adminMeta?.department,
    permissions: admin.adminMeta?.permissions || [],
    avatar: admin.avatar,
    status: admin.status,
    createdAt: admin.createdAt,
  };

  // Create a clean response object
  const response = {
    success: true,
    message:
      "✅ Admin created successfully. Credentials have been sent via email.",
    admin: adminData,
    // Always include the current token to prevent session invalidation
    token: currentAdminToken,
  };

  // Send the response with a 200 status code
  // Also set Cache-Control to prevent any caching issues
  return res
    .set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    )
    .status(200)
    .json(response);
});

/* ============================================================
   ✅ Latest Admin ID (preview only)
============================================================ */
export const latestAdminId = asyncHandler(async (req, res) => {
  let nextNumber = 1;
  const lastAdmin = await User.findOne({
    role: { $in: ["admin", "superadmin"] },
    adminId: { $exists: true },
  })
    .sort({ createdAt: -1 })
    .select("adminId")
    .lean();

  if (lastAdmin?.adminId) {
    const match = lastAdmin.adminId.match(/\d+$/);
    if (match) nextNumber = parseInt(match[0]) + 1;
  }
  const nextId = `GACADM${String(nextNumber).padStart(3, "0")}`;
  res.json({ nextId });
});

/* ============================================================
   ✅ Update Admin Status
============================================================ */
export const updateAdminStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const adminId = req.params.id;

  if (adminId === req.user.id) {
    return res
      .status(400)
      .json({ message: "You cannot modify your own admin status" });
  }

  const admin = await User.findOneAndUpdate(
    { _id: adminId, role: "admin" },
    { status },
    { new: true }
  );

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  res.json({
    success: true,
    message: "Admin status updated successfully",
    admin,
  });
});

/* ============================================================
   ✅ Remove Admin Role
============================================================ */
export const removeAdmin = asyncHandler(async (req, res) => {
  const adminId = req.params.id;

  if (adminId === req.user.id) {
    return res
      .status(400)
      .json({ message: "You cannot delete your own admin account" });
  }

  const admin = await User.findOneAndDelete({ _id: adminId, role: "admin" });

  if (!admin) return res.status(404).json({ message: "Admin not found" });

  try {
    await sendEmail({
      to: admin.email,
      subject: "Admin Account Removed - GreenArc LMS",
      html: `<p>Hello ${admin.name},</p><p>Your admin account has been removed.</p>`,
    });
  } catch (error) {
    console.error("⚠️ Failed to send admin removal email:", error);
  }

  res.json({ message: "Admin deleted successfully" });
});

// -----------------------------------------------
// ✅ UPDATE ADMIN (Full Profile Update)
// -----------------------------------------------
export const updateAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let { name, email, department, permissions, status } = req.body;

  // 1️⃣ Find admin
  const admin = await User.findById(id);

  if (!admin || admin.role !== "admin") {
    res.status(404);
    throw new Error("Admin not found");
  }

  // 2️⃣ Validate email if it is being changed
  if (email && email !== admin.email) {
    const emailExists = await User.findOne({
      email,
      _id: { $ne: id },
    });

    if (emailExists) {
      res.status(400);
      throw new Error("Email is already in use");
    }
  }

  // 3️⃣ Parse permissions safely
  let parsedPermissions = [];
  try {
    if (typeof permissions === "string") {
      parsedPermissions = JSON.parse(permissions);
    } else if (Array.isArray(permissions)) {
      parsedPermissions = permissions;
    }
  } catch (err) {
    parsedPermissions = admin.adminMeta?.permissions || [];
  }

  // 4️⃣ Update fields
  admin.name = name || admin.name;
  admin.email = email || admin.email;
  admin.status = status || admin.status;
  admin.adminMeta = {
    department: department || admin.adminMeta?.department || "",
    permissions: parsedPermissions || admin.adminMeta?.permissions || [],
  };

  // 5️⃣ Handle profile photo
  if (req.file) {
    admin.avatar = `/uploads/${req.file.filename}`;
  }

  // 6️⃣ Save admin
  await admin.save();

  const updated = await User.findById(id).select(
    "-password -passwordHistory -resetOtpHash -resetOtpExpires"
  );

  res.json({
    success: true,
    message: "Admin updated successfully",
    admin: updated,
  });
});
