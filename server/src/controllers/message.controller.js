// server/src/controllers/message.controller.js
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";

/* ============================================================
   👨‍🏫 ADMIN → Send Message (Single or All Students)
============================================================ */
export const sendMessageToStudent = async (req, res) => {
  try {
    const { to, title, body } = req.body;

    if (!title || !body)
      return res.status(400).json({ message: "Title and body are required." });

    const sender = await User.findById(req.user._id);
    if (!sender || sender.role !== "admin")
      return res.status(403).json({ message: "Only admins can send messages." });

    // 🟢 Broadcast to all students
    if (to === "all") {
      const students = await User.find({ role: "student" });
      if (!students.length)
        return res.status(404).json({ message: "No students found." });

      const messages = students.map(
        (student) =>
          new Message({
            from: sender._id,
            to: student._id,
            title,
            body,
          })
      );
      await Message.insertMany(messages);

      return res.status(201).json({
        success: true,
        message: `Broadcast message sent to ${students.length} students ✅`,
      });
    }

    // 🎯 Send to one student
    const receiver = await User.findById(to);
    if (!receiver || receiver.role !== "student")
      return res.status(404).json({ message: "Student not found." });

    const message = await Message.create({
      from: sender._id,
      to: receiver._id,
      title,
      body,
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   👨‍🏫 ADMIN → View Sent Messages
============================================================ */
export const getAdminSentMessages = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);
    if (!admin || admin.role !== "admin")
      return res.status(403).json({ message: "Access denied." });

    const messages = await Message.find({ from: admin._id })
      .sort({ createdAt: -1 })
      .populate("to", "name email");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching admin sent messages:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   🎓 STUDENT → Inbox (Read Only)
============================================================ */
export const getStudentInbox = async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user._id })
      .sort({ createdAt: -1 })
      .populate("from", "name email role");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching student inbox:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   ✅ Mark Messages as Read
============================================================ */
export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: "Message not found" });

    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Message.updateMany({ to: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: "All messages marked as read ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================================================
   🗑️ Delete Message (Admin only)
============================================================ */
export const deleteMessage = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id);
    if (!admin || admin.role !== "admin")
      return res.status(403).json({ message: "Only admin can delete messages." });

    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });

    res.status(200).json({ success: true, message: "Message deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
