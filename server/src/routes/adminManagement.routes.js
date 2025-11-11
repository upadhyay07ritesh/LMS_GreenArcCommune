import express from "express";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import fs from "fs";
import { body } from "express-validator";

// Controllers
import {
  listAdmins,
  addAdmin,
  updateAdminStatus,
  removeAdmin,
} from "../controllers/adminManagement.controller.js";

import {
  getLatestAdminId,
  getAdminById,
} from "../controllers/adminController.js";

import { handleUpload } from "../controllers/uploadController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

/* ============================================================
   🧠 MULTER CONFIGURATION
============================================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created uploads directory:", uploadDir);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

/* ============================================================
   ⚙️ PUBLIC ROUTE (No Auth)
============================================================ */

// ✅ This endpoint is always public
router.get("/admins/latest-id", asyncHandler(getLatestAdminId));

/* ============================================================
   🔒 PROTECTED ADMIN ROUTES
============================================================ */

// Everything after this requires authentication
router.use(protect);

// ✅ Get all admins
router.get("/admins", authorize("admin"), asyncHandler(listAdmins));

// ✅ Add new admin
router.post(
  "/admins",
  authorize("admin", "superadmin"),
  upload.single("profilePhoto"),
  asyncHandler(addAdmin)
);

// ✅ Get admin by ID
router.get("/admins/:id", authorize("admin"), asyncHandler(getAdminById));

// ✅ Update admin status
router.patch(
  "/admins/:id/status",
  authorize("admin", "superadmin"),
  [body("status").isIn(["active", "banned"])],
  asyncHandler(updateAdminStatus)
);

// ✅ Remove admin privileges
router.delete("/admins/:id", authorize("admin", "superadmin"), asyncHandler(removeAdmin));

// ✅ Optional file upload route
router.post("/upload", upload.single("file"), asyncHandler(handleUpload));

export default router;
