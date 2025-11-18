// src/pages/admin/CourseLiveSessions.jsx
import { useState, useEffect, useRef, useCallback } from "react";
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
import { io as ioClient } from "socket.io-client";

/* ----------------- Helpers ----------------- */
function toLocalDTValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

function StatusBadge({ status }) {
  if (status === "live")
    return (
      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
        Live
      </span>
    );
  if (status === "ended")
    return (
      <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
        Ended
      </span>
    );
  if (status === "paused")
    return (
      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
        Paused
      </span>
    );
  if (status === "cancelled")
    return (
      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
        Cancelled
      </span>
    );
  return (
    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
      Upcoming
    </span>
  );
}

/* --------------- Main Component -------------- */
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
  const [actionLoading, setActionLoading] = useState({});
  const socketRef = useRef(null);
  

  /* ------------- Socket Connect -------------- */
  useEffect(() => {
    const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || window.__SOCKET_URL__ || window.location.origin).trim();
    const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      // connected
      // console.debug("admin socket connected", socket.id);
    });

    // Merge updates into session objects so lists stay stable
    socket.on("live:sessionCreated", ({ session }) => {
      if (!session) return;
      setSessions((prev) => {
        if (prev.some((p) => String(p._id) === String(session._id))) return prev;
        return [session, ...prev];
      });
      toast.success("New session created");
    });

    socket.on("live:sessionStarted", ({ id, session }) => {
      setSessions((prev) =>
        prev.map((s) => (String(s._id) === String(id) ? { ...s, ...session, status: "live" } : s))
      );
      toast.info("Session started");
    });

    socket.on("live:sessionEnded", ({ id, session }) => {
      setSessions((prev) =>
        prev.map((s) => (String(s._id) === String(id) ? { ...s, ...session, status: "ended" } : s))
      );
      toast.info("Session ended");
    });

    socket.on("live:sessionDeleted", ({ id }) => {
      setSessions((prev) => prev.filter((s) => String(s._id) !== String(id)));
      toast.info("Session deleted");
    });

    // generic status update event (controller broadcasts live:sessionStatusUpdated)
    socket.on("live:sessionStatusUpdated", ({ id, session, status }) => {
      setSessions((prev) =>
        prev.map((s) => (String(s._id) === String(id) ? { ...s, ...(session || {}), status } : s))
      );
      toast.info(`Status set to ${status}`);
    });

    socket.on("disconnect", () => {
      // disconnected
    });

    return () => socket.disconnect();
  }, []);

  /* -------------- Initial Load --------------- */
  useEffect(() => {
    fetchCourses();
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCourses = async () => {
    try {
      // make sure API path is correct for admin courses endpoint
      const res = await api.get("/admin/courses");
      setCourses((res.data || []).map((c) => ({ value: c._id, label: c.title || c.name })));
    } catch (err) {
      console.error("fetchCourses:", err);
      toast.error("Failed to fetch courses");
    }
  };

  const fetchSessions = async () => {
    setFetchingSessions(true);
    try {
      const { data } = await api.get("/admin/live-sessions");
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => new Date(a.date) - new Date(b.date));
      setSessions(arr);
    } catch (err) {
      console.error("fetchSessions:", err);
      toast.error("Failed to load sessions");
    } finally {
      setFetchingSessions(false);
    }
  };

  /* --------------- Form Handlers -------------- */
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData, date: new Date(formData.date).toISOString() };
      const { data } = await api.post("/admin/live-sessions", payload);

      // optimistic append (server will broadcast to others too)
      setSessions((prev) => [data, ...prev]);
      socketRef.current?.emit("live:sessionCreated", { session: data }); // optional (server usually broadcasts)
      toast.success("Session created");
      setFormData({ course: "", title: "", link: "", date: "" });
    } catch (err) {
      console.error("create session:", err);
      toast.error(err?.response?.data?.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------- Actions (optimistic + rollback A) ------------------ */
  const optimisticUpdateWithRollback = async ({ id, patchFn, apiCall, successToast, errorToast }) => {
    const snapshot = sessions;
    // optimistic UI change
    setSessions((prev) => prev.map((s) => (String(s._id) === String(id) ? patchFn(s) : s)));

    try {
      const { data } = await apiCall();
      // merge server response (if any)
      if (data) {
        setSessions((prev) => prev.map((s) => (String(s._id) === String(id) ? { ...s, ...(data.session ?? data) } : s)));
      }
      if (successToast) toast.success(successToast);
      return { ok: true, data };
    } catch (err) {
      console.error("API failed — rolling back", err);
      // rollback A: restore snapshot
      setSessions(snapshot);
      if (errorToast) toast.error(errorToast);
      return { ok: false, err };
    }
  };

  const startSession = async (id) => {
    try{
      setActionLoading((s) => ({ ...s, [id]: true }));
    const userId = window.__USER__?._id ?? null;
    const userName = window.__USER__?.name ?? null;
    const patchFn = (s) => ({ ...s, status: "live", startedBy: userId, startedByName: userName, startedAt: new Date().toISOString() });

    const res = await optimisticUpdateWithRollback({
      id,
      patchFn,
      apiCall: () => api.post(`/admin/live-sessions/start/${id}`),
      successToast: "Session started",
      errorToast: "Failed to start session — rolled back",
    });

    if (res.ok) socketRef.current?.emit("live:sessionStarted", { id, session: res.data?.session ?? res.data });
    setActionLoading((s) => ({ ...s, [id]: false }));
    }
    catch (err) {
  console.log("BACKEND ERROR:", err.response?.data);
}

  };

  const endSession = async (id) => {
    setActionLoading((s) => ({ ...s, [id]: true }));
    const userId = window.__USER__?._id ?? null;
    const userName = window.__USER__?.name ?? null;
    const patchFn = (s) => ({ ...s, status: "ended", endedBy: userId, endedByName: userName, endedAt: new Date().toISOString() });

    const res = await optimisticUpdateWithRollback({
      id,
      patchFn,
      apiCall: () => api.post(`/admin/live-sessions/end/${id}`),
      successToast: "Session ended",
      errorToast: "Failed to end session — rolled back",
    });

    if (res.ok) socketRef.current?.emit("live:sessionEnded", { id, session: res.data?.session ?? res.data });
    setActionLoading((s) => ({ ...s, [id]: false }));
  };

  // manual status setter
  const setStatusManual = async (id, status) => {
    setActionLoading((s) => ({ ...s, [id]: true }));
    const userId = window.__USER__?._id ?? null;
    const userName = window.__USER__?.name ?? null;

    const patchFn = (s) => {
      const out = { ...s, status };
      if (status === "live") {
        out.startedBy = userId;
        out.startedByName = userName;
        out.startedAt = new Date().toISOString();
      }
      if (status === "ended") {
        out.endedBy = userId;
        out.endedByName = userName;
        out.endedAt = new Date().toISOString();
      }
      return out;
    };

    const res = await optimisticUpdateWithRollback({
      id,
      patchFn,
      apiCall: () => api.post(`/admin/live-sessions/status/${id}`, { status }),
      successToast: `Status set ${status}`,
      errorToast: "Failed to change status — rolled back",
    });

    if (res.ok) socketRef.current?.emit("live:sessionStatusUpdated", { id, session: res.data?.session ?? res.data, status });
    setActionLoading((s) => ({ ...s, [id]: false }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    setActionLoading((s) => ({ ...s, [id]: true }));
    const snapshot = sessions;
    setSessions((prev) => prev.filter((s) => String(s._id) !== String(id)));

    try {
      await api.delete(`/admin/live-sessions/${id}`);
      socketRef.current?.emit("live:sessionDeleted", { id });
      toast.success("Deleted");
    } catch (err) {
      console.error("Delete failed — rollback", err);
      setSessions(snapshot);
      toast.error("Failed to delete");
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  /* ----------------- Layout 2 UI (compact, premium) ----------------- */
  return (
    <div className="min-h-screen py-8 px-4 sm:px-8 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions list (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All Live Sessions</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start or manage sessions — students update in real-time.</p>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {fetchingSessions ? "Loading..." : `${sessions.length} sessions`}
              </div>
            </div>

            {sessions.length === 0 && !fetchingSessions ? (
              <div className="text-center py-8 text-slate-500">No sessions yet.</div>
            ) : (
              <div className="space-y-4">
                {sessions.map((s) => {
                  const startedByLabel = s.startedByName || (s.startedBy && s.startedBy.name) || s.startedBy || null;
                  const endedByLabel = s.endedByName || (s.endedBy && s.endedBy.name) || s.endedBy || null;

                  return (
                    <div
                      key={s._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-white/50 dark:bg-slate-800/60"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg text-slate-900 dark:text-white truncate">{s.title}</h4>
                          <div className="hidden sm:block">{s.status && <StatusBadge status={s.status} />}</div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-2">
                          <div className="flex items-center gap-2">
                            <HiAcademicCap className="w-4 h-4" />
                            <span>{s.course?.title || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <HiCalendar className="w-4 h-4" />
                            <span>{toLocalDTValue(s.date).replace("T", " • ")}</span>
                          </div>
                          <a href={s.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-0.5 text-xs rounded text-indigo-600 hover:underline">
                            <HiLink className="w-4 h-4" /> Link
                          </a>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                          {s.status === "live" && startedByLabel && <span>Started by {startedByLabel}</span>}
                          {s.status === "ended" && endedByLabel && <span>Ended by {endedByLabel}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        {s.status !== "live" ? (
                          <button
                            onClick={() => startSession(s._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            disabled={!!actionLoading[s._id]}
                          >
                            <HiPlay /> Start
                          </button>
                        ) : (
                          <button
                            onClick={() => endSession(s._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                            disabled={!!actionLoading[s._id]}
                          >
                            <HiStop /> End
                          </button>
                        )}

                        <select
                          aria-label="manual status"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            setStatusManual(s._id, val);
                            e.target.value = "";
                          }}
                          className="px-3 py-2 rounded-lg border bg-white text-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Set status...
                          </option>
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live</option>
                          <option value="paused">Paused</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="ended">Ended</option>
                        </select>

                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-rose-600 hover:bg-rose-50"
                          disabled={!!actionLoading[s._id]}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* tip */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border text-sm text-slate-600 dark:text-slate-300">
            <strong>Pro tip:</strong> Students will see "Join" while a session is Live. Use manual status only if necessary.
          </div>
        </div>

        {/* Right: Create form (1/3 width) */}
        <aside className="space-y-6">
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                <HiVideoCamera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Create Session</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add session — it appears to students instantly.</p>
              </div>
            </div>

            <div className="grid gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-300">Course</label>
              <select name="course" value={formData.course} onChange={handleChange} className="input">
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <label className="text-xs text-slate-600 dark:text-slate-300">Title</label>
              <input name="title" value={formData.title} onChange={handleChange} className="input" required />

              <label className="text-xs text-slate-600 dark:text-slate-300">Meeting Link</label>
              <input name="link" type="url" value={formData.link} onChange={handleChange} className="input" required />

              <label className="text-xs text-slate-600 dark:text-slate-300">Date & Time</label>
              <input name="date" type="datetime-local" value={formData.date} onChange={handleChange} className="input" required />

              <button type="submit" disabled={loading} className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {loading ? "Saving..." : "Save Session"}
              </button>
            </div>
          </motion.form>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border text-sm">
            <h4 className="font-medium mb-2">Quick actions</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => fetchSessions()} className="w-full px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200">
                Refresh sessions
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  toast.success("Origin copied");
                }}
                className="w-full px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                Copy origin
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
