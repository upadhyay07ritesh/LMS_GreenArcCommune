import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  HiCalendar,
  HiLink,
  HiAcademicCap,
  HiTrash,
  HiPlay,
  HiStop,
  HiVideoCamera,
} from "react-icons/hi2";

// Fix timezone issue (datetime-local)
function toLocalDTValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

export default function CourseLiveSessions() {
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({
    course: "",
    title: "",
    link: "",
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchingSessions, setFetchingSessions] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // { [id]: true }

  useEffect(() => {
    fetchCourses();
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      const formatted = (res.data || []).map((c) => ({
        value: c._id,
        label: c.title || c.name,
      }));
      setCourses(formatted);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      toast.error("Failed to fetch courses");
    }
  };

  const fetchSessions = async () => {
    setFetchingSessions(true);
    try {
      const { data } = await api.get("/admin/live-sessions");
      // ensure array
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      toast.error("Failed to load sessions");
    } finally {
      setFetchingSessions(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Create Live Session
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(), // store as ISO
      };

      const { data } = await api.post("/admin/live-sessions", payload);

      toast.success("Session created successfully!");
      // server returns created session object
      setSessions((prev) => [data, ...prev]);
      setFormData({ course: "", title: "", link: "", date: "" });
    } catch (err) {
      console.error("Failed to save session:", err);
      toast.error(err?.response?.data?.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      setActionLoading((s) => ({ ...s, [id]: true }));
      await api.delete(`/admin/live-sessions/${id}`);
      toast.success("Deleted!");
      setSessions((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete session");
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // START SESSION
  const startSession = async (id) => {
  try {
    setActionLoading((s) => ({ ...s, [id]: true }));

    const { data } = await api.post(`/admin/live-sessions/start/${id}`);

    // normalize the returned session object
    const updated = data?.session ?? data;

    if (updated && updated._id) {
      setSessions((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, status: "live" } : s
        )
      );
    }

    toast.success("Session started!");
  } catch (err) {
    console.error("Start error:", err);
    toast.error("Failed to start session");
  } finally {
    setActionLoading((s) => ({ ...s, [id]: false }));
  }
};


  // END SESSION
const endSession = async (id) => {
  try {
    setActionLoading((s) => ({ ...s, [id]: true }));

    const { data } = await api.post(`/admin/live-sessions/end/${id}`);

    const updated = data?.session ?? data;

    if (updated && updated._id) {
      setSessions((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, status: "ended" } : s
        )
      );
    }

    toast.info("Session ended");
  } catch (err) {
    console.error("End error:", err);
    toast.error("Failed to end session");
  } finally {
    setActionLoading((s) => ({ ...s, [id]: false }));
  }
};


  // UI badge rendering
  const StatusBadge = ({ status }) => {
    if (status === "live")
      return (
        <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold">
          Live Now
        </span>
      );

    if (status === "ended")
      return (
        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold">
          Ended
        </span>
      );

    return (
      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
        Upcoming
      </span>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        Manage Course Live Sessions
      </h1>

      {/* CREATE NEW LIVE SESSION FORM */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 space-y-6"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <HiVideoCamera className="text-primary-600" />
          Create New Session
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* COURSE */}
          <div>
            <label className="label">Select Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
              className="input"
            >
              <option value="">-- Select Course --</option>
              {courses.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* TITLE */}
          <div>
            <label className="label">Session Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
              placeholder="Session Title"
            />
          </div>

          {/* LINK */}
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

          {/* DATE */}
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

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary px-6 py-2.5"
        >
          {loading ? "Saving..." : "Save Session"}
        </button>
      </motion.form>

      {/* SESSION LIST */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-5 text-slate-900 dark:text-white">
          All Live Sessions
        </h2>

        {fetchingSessions ? (
          <p className="text-slate-500">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No sessions yet.</p>
        ) : (
          <div className="space-y-6">
            {sessions.map((s) => (
              <div
                key={s._id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-200 dark:border-slate-700 pb-4"
              >
                <div>
                  <h4 className="font-semibold text-lg text-slate-900 dark:text-white">
                    {s.title}
                  </h4>

                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <HiAcademicCap className="w-4 h-4" />
                    {s.course?.title || "Unknown Course"}
                  </p>

                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <HiCalendar className="w-4 h-4" />
                    {toLocalDTValue(s.date).replace("T", " • ")}
                  </p>

                  <a
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <HiLink className="w-4 h-4" /> Meeting Link
                  </a>

                  <div className="mt-2">
                    <StatusBadge status={s.status} />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-3">
                  {s.status !== "live" && (
                    <button
                      onClick={() => startSession(s._id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      disabled={!!actionLoading[s._id]}
                    >
                      <HiPlay className="w-4 h-4" />
                      Start
                    </button>
                  )}

                  {s.status === "live" && (
                    <button
                      onClick={() => endSession(s._id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      disabled={!!actionLoading[s._id]}
                    >
                      <HiStop className="w-4 h-4" />
                      End
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(s._id)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 dark:text-red-300 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={!!actionLoading[s._id]}
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
