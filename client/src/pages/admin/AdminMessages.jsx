import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineTrash,
  HiOutlinePaperAirplane,
  HiChatBubbleOvalLeftEllipsis,
  HiXMark,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import api from "../../api/axios.js";

export default function AdminMessages() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 🔹 Load courses
  const loadCourses = useCallback(async () => {
    try {
      const res = await api.get("/admin/courses");
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      toast.error("Failed to load courses");
    }
  }, []);

  // 🔹 Load all students + messages
const loadData = useCallback(async () => {
  try {
    setLoading(true);
    const [studentsRes, messagesRes] = await Promise.all([
      api.get("/admin/students", {
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      }),
      api.get("/messages/admin/sent", {
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      }),
    ]);
    setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
    setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
  } catch (err) {
    console.error("Error loading data:", err);
    toast.error("Failed to load students or messages");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
  console.log("Students data from API:", students);
}, [students]);


  // 🧩 Initial load
  useEffect(() => {
    loadCourses();
    loadData();
  }, [loadCourses, loadData]);

  // 🔍 Filtered students (robust client-side filter)
const filteredStudents = useMemo(() => {
  if (!selectedCourse) return students;

  return students.filter((s) => {
    if (!s.course) return false;

    // Case 1: course is an object { _id, name }
    if (typeof s.course === "object" && s.course._id) {
      return s.course._id === selectedCourse;
    }

    // Case 2: course is stored as a direct string ID
    if (typeof s.course === "string" && s.course.match(/^[a-f\d]{24}$/i)) {
      return s.course === selectedCourse;
    }

    // Case 3: course is stored by name (e.g. "GLT")
    const selectedCourseObj = courses.find((c) => c._id === selectedCourse);
    if (selectedCourseObj && s.course === selectedCourseObj.name) {
      return true;
    }

    return false;
  });
}, [students, selectedCourse, courses]);


  // ✉️ Send Message
  const sendMessage = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSending(true);

      // ✅ Send to all students of selected course (frontend filter)
      if (selectedStudent === "all" && selectedCourse) {
        const selectedStudents = filteredStudents.map((s) => s._id);
        await api.post("/messages/admin/send-course", {
          course: selectedCourse,
          title,
          body,
          studentIds: selectedStudents, // optional if backend uses it
        });
        toast.success("Message sent to all students in selected course ✅");
      }
      // ✅ Send to all students (global)
      else if (selectedStudent === "all" && !selectedCourse) {
        await api.post("/messages/admin/send", {
          to: "all",
          title,
          body,
        });
        toast.success("Message broadcasted to all students ✅");
      }
      // ✅ Send to a single student
      else {
        await api.post("/messages/admin/send", {
          to: selectedStudent,
          title,
          body,
        });
        toast.success("Message sent successfully ✅");
      }

      // Reset form
      setTitle("");
      setBody("");
      setSelectedStudent("");
      const res = await api.get("/messages/admin/sent");
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Send message error:", err);
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !sending) sendMessage();
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await api.delete(`/messages/admin/${id}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
      toast.info("Message deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete message");
    }
  };

  return (
    <>
      {/* 💬 Floating Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-1/2 -translate-y-1/2 right-0
          bg-green-600 hover:bg-green-700 text-white shadow-lg px-4 py-4 rounded-l-2xl z-[9998]"
      >
        <HiChatBubbleOvalLeftEllipsis className="w-6 h-6" />
      </motion.button>

      {/* 🪟 Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9997]"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-[9999]
                w-[92vw] sm:w-[80vw] md:w-[50vw] max-w-[560px] min-w-[320px]
                bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700
                shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Admin Messages
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <HiXMark className="w-6 h-6 text-slate-700 dark:text-white" />
                </button>
              </div>

              {/* Form */}
              <div
                className="p-4 border-b border-slate-100 dark:border-slate-800"
                onKeyDown={onKeyDown}
              >
                {/* 🧭 Select Course */}
                <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedStudent(""); // reset recipient when course changes
                  }}
                  className="w-full mb-3 border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-transparent text-slate-800 dark:text-white"
                >
                  <option value="">-- All Courses --</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* 👤 Select Recipient */}
                <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                  Select Recipient
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full mb-3 border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-transparent text-slate-800 dark:text-white"
                >
                  <option value="">-- Choose a Student --</option>
                  <option value="all">📢 All Students</option>
                  {filteredStudents.length === 0 ? (
                    <option disabled>No students found</option>
                  ) : (
                    filteredStudents.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.email})
                      </option>
                    ))
                  )}
                </select>

                {/* 📝 Message Inputs */}
                <input
                  type="text"
                  placeholder="Message Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mb-3 border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-transparent text-slate-800 dark:text-white"
                />
                <textarea
                  placeholder="Type your message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-transparent text-slate-800 dark:text-white h-28 resize-none"
                />

                {/* 🚀 Send Button */}
                <button
                  disabled={sending || !title.trim() || !body.trim() || !selectedStudent}
                  onClick={sendMessage}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2 flex items-center justify-center gap-2"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5 rotate-45" />
                  {sending
                    ? "Sending..."
                    : selectedStudent === "all"
                    ? selectedCourse
                      ? "Send to Course"
                      : "Send to All"
                    : "Send Message"}
                </button>
              </div>

              {/* 📜 Sent Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <p className="text-center text-slate-400">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400">No messages yet</p>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800 relative"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-slate-800 dark:text-white">
                          {msg.title}
                        </h4>
                        <button
                          onClick={() => deleteMessage(msg._id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                        >
                          <HiOutlineTrash className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {msg.body}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Sent on {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
