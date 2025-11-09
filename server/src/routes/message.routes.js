// server/src/routes/message.routes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  sendMessageToStudent,
  getAdminSentMessages,
  getStudentInbox,
  markAsRead,
  markAllAsRead,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

/* ==============================
   👨‍🏫 ADMIN ROUTES
============================== */

// Send message (to single or all students)
router.post("/admin/send", protect, sendMessageToStudent);

// Get messages sent by admin
router.get("/admin/sent", protect, getAdminSentMessages);

// Delete admin message
router.delete("/admin/:id", protect, deleteMessage);

/* ==============================
   🎓 STUDENT ROUTES
============================== */

// Get student inbox
router.get("/student/inbox", protect, getStudentInbox);

// Mark messages as read
router.patch("/student/:id/read", protect, markAsRead);
router.patch("/student/mark-all-read", protect, markAllAsRead);
// POST /messages/admin/send-course
router.post("/messages/admin/send-course", async (req, res) => {
  const { course, title, body } = req.body;
  if (!course || !title || !body)
    return res.status(400).json({ message: "Missing fields" });

  const students = await Student.find({ course });
  if (!students.length)
    return res.status(404).json({ message: "No students in this course" });

  // Loop send or bulk insert messages
  await Promise.all(
    students.map((s) =>
      Message.create({
        to: s._id,
        title,
        body,
        sender: "admin",
      })
    )
  );

  res.json({ message: "Message sent to all students in course" });
});


export default router;
