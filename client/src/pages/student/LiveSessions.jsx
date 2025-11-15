import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineVideoCamera,
  HiOutlineCalendarDays,
  HiOutlineBell,
  HiOutlineLink,
} from "react-icons/hi2";
import { useEffect, useState, useRef } from "react";
import api from "../../api/axios.js";

/**
 * Config
 */
const STATUS_ENDPOINT = (id) => `/student/live-sessions/status/${id}`; // student route
const FALLBACK_DURATION_MIN = 60; // used by client-side time calc if server status not available
const POLL_SERVER_MS = 15000; // poll server for status every 15s
const UI_TICK_MS = 30000; // UI refresh every 30s

function parseSessionDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const noTZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
  if (noTZ.test(s)) {
    const [datePart, timePart] = s.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm, ss = "0"] = timePart.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, ss);
  }
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) {
    const fallback = new Date(Date.parse(s));
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  return parsed;
}

function clientStatusFromDate(dateISO, durationMin = FALLBACK_DURATION_MIN) {
  const start = parseSessionDate(dateISO)?.getTime();
  if (!start) return { state: "unknown", diffMin: 0 };

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
  const [sessions, setSessions] = useState([]); // session objects from server
  const [loading, setLoading] = useState(true);
  const [uiTick, setUiTick] = useState(0); // drives UI refresh for badges
  const [serverStatuses, setServerStatuses] = useState({}); // { [sessionId]: 'idle'|'live'|'ended'|'unknown' }
  const pollingRef = useRef(null);

  // Fetch sessions on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get("/student/live-sessions");
        const arr = Array.isArray(res.data) ? res.data : [];
        // sort by date ascending (nearest first)
        arr.sort((a, b) => {
          const da = parseSessionDate(a.date)?.getTime() || 0;
          const db = parseSessionDate(b.date)?.getTime() || 0;
          return da - db;
        });
        if (mounted) setSessions(arr);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // UI tick for updating "Live Now" etc.
  useEffect(() => {
    const t = setInterval(() => setUiTick((t) => t + 1), UI_TICK_MS);
    return () => clearInterval(t);
  }, []);

  // Poll server for each session status (if endpoint exists).
  useEffect(() => {
    let cancelled = false;

    async function fetchStatuses() {
      if (!sessions.length) return;
      const nextStatuses = { ...serverStatuses };

      await Promise.all(
        sessions.map(async (s) => {
          const id = s._id;
          if (!id) return;
          try {
            const res = await api.get(STATUS_ENDPOINT(id));
            const server =
              (res.data && res.data.status) || res.data || "unknown";
            nextStatuses[id] = server;
          } catch (err) {
            // 404 or protected endpoint -> fallback to client-side calc later
            nextStatuses[id] = "unknown";
          }
        })
      );

      if (!cancelled) setServerStatuses(nextStatuses);
    }

    // initial immediate fetch
    fetchStatuses();

    // clear previous interval
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchStatuses, POLL_SERVER_MS);

    return () => {
      cancelled = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]); // re-run when sessions change

  // Reminder (browser notification) - guarded and improved
  const setReminder = (session) => {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }
    const parsed = parseSessionDate(session.date);
    if (!parsed) {
      alert("Cannot parse session date for reminder.");
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission !== "granted") {
        alert("Notifications not allowed.");
        return;
      }

      const sessionTime = parsed.getTime();
      const reminderTime = sessionTime - 10 * 60 * 1000; // 10 minutes before
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

      alert(
        `Reminder set for "${session.title}" (10 minutes before start). Keep this tab open for the reminder to trigger.`
      );
    });
  };

  // Add to Google Calendar
  const addToGoogleCalendar = (session) => {
    const start = parseSessionDate(session.date);
    if (!start) {
      alert("Invalid session date");
      return;
    }
    const end = new Date(
      start.getTime() + (session.durationMin || FALLBACK_DURATION_MIN) * 60000
    );

    // Format for Google Calendar (UTC)
    const formatLocalForGoogle = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      const utc = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      const pad2 = (n) => String(n).padStart(2, "0");
      return `${utc.getFullYear()}${pad2(utc.getMonth() + 1)}${pad2(
        utc.getDate()
      )}T${pad2(utc.getHours())}${pad2(utc.getMinutes())}00Z`;
    };

    const dates = `${formatLocalForGoogle(start)}/${formatLocalForGoogle(end)}`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      session.title
    )}&dates=${dates}&details=${encodeURIComponent(
      session.description || ""
    )}&location=${encodeURIComponent(session.link || "")}&sf=true&output=xml`;
    window.open(url, "_blank");
  };

  // Copy link (for join)
  const copyLink = async (link) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Link copied to clipboard");
    }
  };

  // Determine effective status for a session:
  // Prefer server status if known ('live'|'idle'|'ended'), otherwise fallback to client time-based
  const effectiveStatus = (s) => {
    const server = serverStatuses[s._id];
    if (server && server !== "unknown") {
      const normalized = String(server).toLowerCase();
      if (["live", "started", "running"].includes(normalized))
        return { state: "live", source: "server" };
      if (["ended", "finished", "stopped"].includes(normalized))
        return { state: "ended", source: "server" };
      return { state: "upcoming", source: "server" };
    }
    // fallback (rare)
    const fallback = clientStatusFromDate(
      s.date,
      s.durationMin || FALLBACK_DURATION_MIN
    );
    return {
      state: fallback.state,
      diffMin: fallback.diffMin,
      source: "client",
    };
  };

  // Small UI helper for date/time string
  const sessionDateLabel = (s) => {
    const parsed = parseSessionDate(s.date);
    if (!parsed) return "Invalid date";
    return parsed.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
                  Upcoming and ongoing sessions — join when your instructor
                  starts the session
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </div>
              <div className="text-xs text-slate-400 mt-1 hidden sm:block">
                Refreshes automatically
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.p
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-slate-500 text-sm py-8"
                >
                  Loading sessions...
                </motion.p>
              ) : sessions.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <HiOutlineCalendarDays className="w-12 h-12 text-slate-400 mb-3" />
                  <h4 className="text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    No upcoming sessions
                  </h4>
                  <p className="text-slate-500 text-sm">
                    Stay tuned — new live classes will appear here soon.
                  </p>
                </motion.div>
              ) : (
                sessions.map((s, idx) => {
                  const { state, diffMin, source } = effectiveStatus(s);
                  const parsed = parseSessionDate(s.date);
                  const startsIn =
                    state === "upcoming"
                      ? diffMin ?? clientStatusFromDate(s.date).diffMin
                      : 0;
                  const joinEnabled = state === "live";
                  const ended = state === "ended";

                  return (
                    <motion.div
                      key={s._id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 last:border-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h4 className="font-semibold text-slate-900 dark:text-white text-base sm:text-lg truncate">
                            {s.title}
                          </h4>

                          {/* status badge */}
                          {state === "live" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                              </span>
                              Live Now
                            </span>
                          )}

                          {state === "upcoming" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Starts in {startsIn} min
                            </span>
                          )}

                          {state === "ended" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Ended
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1 truncate">
                          {s.description || "No description provided."}
                        </p>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          <strong>{sessionDateLabel(s)}</strong>
                          {s.instructor ? ` • ${s.instructor}` : ""}
                          {s.durationMin ? ` • ${s.durationMin} min` : ""}
                          {source === "server" && (
                            <span className="ml-2 text-xxs text-slate-400">
                              (server status)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* actions */}
                      <div className="flex items-center gap-2">
                        {/* Join button */}
                        <a
                          href={joinEnabled ? s.link || "#" : "#"}
                          target={joinEnabled ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          role="button"
                          aria-disabled={!joinEnabled}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-shadow shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            ended
                              ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                              : joinEnabled
                              ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                              : "bg-amber-500/10 text-amber-700 cursor-not-allowed"
                          }`}
                          onClick={(e) => {
                            if (!joinEnabled) e.preventDefault();
                          }}
                        >
                          {ended
                            ? "Session Ended"
                            : joinEnabled
                            ? "Join Now"
                            : "Waiting for Admin..."}
                        </a>

                        {/* Copy link */}
                        <button
                          onClick={() => copyLink(s.link)}
                          className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="Copy join link"
                        >
                          <HiOutlineLink className="w-4 h-4" />
                        </button>

                        {/* Reminder */}
                        <button
                          onClick={() => setReminder(s)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          title="Set reminder (10 minutes before)"
                        >
                          <HiOutlineBell className="w-4 h-4 text-green-600" />
                          <span className="hidden sm:inline">Remind Me</span>
                        </button>

                        {/* Add to calendar */}
                        <button
                          onClick={() => addToGoogleCalendar(s)}
                          className="hidden sm:inline text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 underline"
                          title="Add to Google Calendar"
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
        </div>
      </motion.div>
    </div>
  );
}
