import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { HiCalendar, HiLink, HiAcademicCap, HiTrash } from "react-icons/hi2";

export default function CourseLiveSessions() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({ course: "", title: "", link: "", date: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchSessions();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      const formatted = res.data.map((c) => ({ value: c._id, label: c.name }));
      setCourses(formatted);
    } catch {
      toast.error("Failed to fetch courses");
    }
  };

  const fetchSessions = async () => {
    try {
      const { data } = await api.get("/admin/live-sessions");
      setSessions(data);
    } catch {
      toast.error("Failed to load sessions");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/admin/live-sessions", formData);
      toast.success("Session saved successfully!");
      fetchSessions();
      setFormData({ course: "", title: "", link: "", date: "" });
    } catch {
      toast.error("Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await api.delete(`/admin/live-sessions/${id}`);
    toast.success("Deleted!");
    fetchSessions();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Course Live Sessions</h1>

      {/* Add / Update Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border border-slate-200 dark:border-slate-700 space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Course</label>
            <select name="course" value={formData.course} onChange={handleChange} required className="input">
              <option value="">-- Select Course --</option>
              {courses.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Session Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
              placeholder="Session title"
            />
          </div>

          <div>
            <label className="label">Meeting Link</label>
            <input
              name="link"
              type="url"
              value={formData.link}
              onChange={handleChange}
              required
              className="input"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div>
            <label className="label">Date & Time</label>
            <input
              name="date"
              type="datetime-local"
              value={formData.date}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving..." : "Save Session"}
        </button>
      </motion.form>

      {/* Session List */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-4">All Course Live Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No sessions yet.</p>
        ) : (
          sessions.map((s) => (
            <div key={s._id} className="flex justify-between items-center border-b border-slate-200 py-3">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{s.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <HiAcademicCap className="inline w-4 h-4" /> {s.course?.title || "Unknown Course"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <HiCalendar className="inline w-4 h-4" /> {new Date(s.date).toLocaleString()}
                </p>
                <a href={s.link} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                  <HiLink className="inline w-4 h-4" /> Join Link
                </a>
              </div>
              <button onClick={() => handleDelete(s._id)} className="btn btn-outline text-red-500">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
