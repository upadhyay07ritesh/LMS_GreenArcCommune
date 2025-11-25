import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/trades/");
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `trade_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,

  // ADD THIS 👇 (ensures multers reads all text fields)
  limits: {
    fileSize: 5 * 1024 * 1024,
    fieldNameSize: 200,
    fieldSize: 5 * 1024 * 1024,
    fields: 20, // <-- IMPORTANT
  },

  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
});

export default upload;
