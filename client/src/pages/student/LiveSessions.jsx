import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineVideoCamera,
  HiOutlineCalendarDays,
  HiOutlineBell,
} from "react-icons/hi2";
import { useEffect, useState } from "react";
import api from "../../api/axios.js";

// 🧭 Helper to detect session status
function getStatus(dateISO, durationMin = 60) {
  const start = new Date(dateISO).getTime();
  const end = start + durationMin * 60 * 1000;
  const now = Date.now();

  if (now >= start && now <= end) return { state: "live", diffMin: 0 };
  if (now < start) {
    const diffMin = Math.max(0, Math.round((start - now) / 60000));
    return { state: "upcoming", diffMin };
  }
  return { state: "ended", diffMin: 0 };
}

export default function LiveSessions() {
  const [liveSessions, setLiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // 🧠 Fetch student sessions (correct route)
  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await api.get("/student/live-sessions");
        // sort sessions by date (nearest first)
        const sorted = (res.data || []).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setLiveSessions(sorted);
      } catch (err) {
        console.error("Error fetching live sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  // ⏱️ Update every 30s to refresh "Live Now" badge
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // 🔔 Reminder
  const setReminder = (session) => {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const sessionTime = new Date(session.date).getTime();
        const reminderTime = sessionTime - 10 * 60 * 1000;
        const delay = reminderTime - Date.now();

        if (delay <= 0) {
          alert("This session is starting soon — you can join directly!");
          return;
        }

        setTimeout(() => {
          new Notification("Live Session Reminder", {
            body: `${session.title} starts in 10 minutes!`,
            icon: "/GreenArcLogo.png",
          });
        }, delay);

        alert(`Reminder set for "${session.title}" (10 min before start)`);
      }
    });
  };

  // 📅 Add to Google Calendar
  const addToGoogleCalendar = (session) => {
    const start = new Date(session.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const format = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      session.title
    )}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(
      session.description || "Join this Green Arc Commune Live Session"
    )}&location=${encodeURIComponent(session.link)}&sf=true&output=xml`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen pt-12 px-4 sm:px-8 bg-gray-50 dark:bg-slate-900 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* ===== Header ===== */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineVideoCamera className="text-green-600 w-6 h-6" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Live Sessions
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>

        {/* ===== Body ===== */}
        <div className="p-5 sm:p-6 space-y-3 sm:space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-slate-500 text-sm"
              >
                Loading sessions...
              </motion.p>
            ) : liveSessions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-12"
              >
                <HiOutlineCalendarDays className="w-12 h-12 text-slate-400 mb-3" />
                <h4 className="text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  No upcoming sessions
                </h4>
                <p className="text-slate-500 text-sm">
                  Stay tuned! New live classes will appear here soon.
                </p>
              </motion.div>
            ) : (
              liveSessions.map((s, i) => {
                void tick;
                const { state, diffMin } = getStatus(s.date, 60);

                return (
                  <motion.div
                    key={s._id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 border-b border-slate-100 dark:border-slate-700 pb-3 last:border-none"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg">
                          {s.title}
                        </h4>

                        {state === "live" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            Live Now
                          </span>
                        )}

                        {state === "upcoming" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            Starts in {diffMin} min
                          </span>
                        )}

                        {state === "ended" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Ended
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {new Date(s.date).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-md hover:shadow-lg active:scale-95 ${
                          state === "live"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {state === "live" ? "Join Now" : "Join Live"}
                      </a>

                      <button
                        onClick={() => setReminder(s)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                      >
                        <HiOutlineBell className="w-4 h-4 text-green-600" />
                        <span>Remind Me</span>
                      </button>

                      <button
                        onClick={() => addToGoogleCalendar(s)}
                        className="hidden sm:block text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline transition-all"
                      >
                        Add to Calendar
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
