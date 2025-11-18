import { motion } from "framer-motion";
import { HiOutlineVideoCamera, HiOutlineCalendarDays, HiOutlineLink } from "react-icons/hi2";
import { useEffect, useState } from "react";
import api from "../../api/axios.js";

export default function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions only once
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/student/live-sessions");
        setSessions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const copyLink = async (link) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copied to clipboard");
    } catch {
      alert("Failed to copy link");
    }
  };

  return (
    <div className="min-h-screen pt-10 px-4 sm:px-8 bg-gray-50 dark:bg-slate-900 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">

          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiOutlineVideoCamera className="text-green-600 w-6 h-6" />
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  Live Sessions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Join your live sessions directly
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4">
            {loading ? (
              <p className="text-center text-slate-500 text-sm py-8">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <HiOutlineCalendarDays className="w-12 h-12 text-slate-400 mb-3" />
                <h4 className="text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  No sessions available
                </h4>
              </div>
            ) : (
              sessions.map((s, idx) => (
                <motion.div
                  key={s._id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 last:border-none"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg truncate">
                      {s.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 truncate">
                      {s.description || "No description provided."}
                    </p>

                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <strong>{new Date(s.date).toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2">
                    {/* Direct Join button */}
                    <a
                      href={s.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                    >
                      Join Now
                    </a>

                    <button
                      onClick={() => copyLink(s.link)}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm"
                    >
                      <HiOutlineLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
