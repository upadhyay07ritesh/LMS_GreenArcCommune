// src/pages/student/LiveSessions.jsx
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineVideoCamera,
  HiOutlineCalendarDays,
  HiOutlineLink,
  HiOutlineBell,
} from "react-icons/hi2";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import api from "../../api/axios.js";
import { io as ioClient } from "socket.io-client";

/* ---------------- CONFIG ---------------- */
const STATUS_ENDPOINT = (id) => `/student/live-sessions/status/${id}`;
const POLL_SERVER_MS = 10_000; // fallback polling

/* ---------------- HELPERS ---------------- */
function parseSessionDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function shortTimeLabel(d) {
  if (!d) return "Invalid date";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function clientStatusFromDate(dateISO, durationMin = 60) {
  const start = parseSessionDate(dateISO)?.getTime();
  if (!start) return { state: "unknown" };

  const end = start + durationMin * 60 * 1000;
  const now = Date.now();

  if (now >= start && now <= end) {
    return { state: "live", startedAt: start };
  }
  if (now < start) {
    const diffMin = Math.max(0, Math.round((start - now) / 60000));
    return { state: "upcoming", startsInMin: diffMin, startsAt: start };
  }
  return { state: "ended" };
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function LiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [serverStatuses, setServerStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const pollingRef = useRef(null);

  /* ---------- Toast helper ---------- */
  const toastInfo = useCallback((msg, timeout = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  }, []);

  function fireNotification(title, body) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo192.png", // optional
      });
    }
  }
  /* ---------- Socket.IO ---------- */
  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL?.trim() || window.location.origin;
    const socket = ioClient(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      // connected
    });

    // Create — append (append-only to avoid reorders on remote create)
    socket.on("live:sessionCreated", ({ session }) => {
      setSessions((prev) => {
        if (prev.some((x) => String(x._id) === String(session._id)))
          return prev;
        // append then sort by date so UI remains chronological
        const next = [...prev, session];
        next.sort((a, b) => new Date(a.date) - new Date(b.date));
        toastInfo("New session available: " + (session.title || "Untitled"));
        return next;
      });
    });

    // Start — update status minimally (no full list reorder)
    socket.on("live:sessionStarted", ({ id, session }) => {
      setServerStatuses((prev) => ({ ...prev, [id]: "live" }));
      setSessions((prev) =>
        prev.map((s) =>
          String(s._id) === String(id)
            ? { ...s, ...session, status: "live" }
            : s
        )
      );

      toastInfo("A session has started — you can join now");

      // 🔔 NEW: Browser Notification
      fireNotification(
        "Session Started",
        `${session.title || "A session"} is now live. Join now!`
      );
    });

    // End — update status & keep list order
    socket.on("live:sessionEnded", ({ id, session }) => {
      setServerStatuses((prev) => ({ ...prev, [id]: "ended" }));
      setSessions((prev) =>
        prev.map((s) =>
          String(s._id) === String(id)
            ? { ...s, ...session, status: "ended" }
            : s
        )
      );

      toastInfo("A session ended");

      // 🔔 NEW Notify
      fireNotification(
        "Session Ended",
        `${session.title || "A session"} has ended.`
      );
    });

    // Generic status update (manual status changes)
    socket.on("live:sessionStatusUpdated", ({ id, session, status }) => {
      setServerStatuses((prev) => ({ ...prev, [id]: status }));
      setSessions((prev) =>
        prev.map((s) =>
          String(s._id) === String(id) ? { ...s, ...session, status } : s
        )
      );
      toastInfo(`Session status updated: ${status}`);

      // 🔔 NEW
      fireNotification(
        "Status Changed",
        `${session.title || "A session"} is now ${status}.`
      );
    });

    // Delete
    socket.on("live:sessionDeleted", ({ id }) => {
      setSessions((prev) => prev.filter((s) => String(s._id) !== String(id)));
      setServerStatuses((prev) => {
        const x = { ...prev };
        delete x[id];
        return x;
      });
      toastInfo("A session was removed");
    });

    socket.on("disconnect", () => {
      // disconnected
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastInfo]);

  /* ---------- initial fetch (sorted once) ---------- */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get("/student/live-sessions");
        if (!mounted) return;
        const arr = Array.isArray(res.data) ? res.data : [];
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));
        setSessions(arr);
      } catch (err) {
        console.error("Failed to load sessions", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  /* ---------- polling fallback for status (merge-only) ---------- */
  useEffect(() => {
    async function fetchStatuses() {
      if (!sessions.length) return;
      const next = {};
      await Promise.all(
        sessions.map(async (s) => {
          try {
            const res = await api.get(STATUS_ENDPOINT(s._id));
            next[s._id] = res.data?.status ?? "unknown";
          } catch {
            next[s._id] = "unknown";
          }
        })
      );

      setServerStatuses((prev) => {
        let changed = false;
        const merged = { ...prev };
        for (const k of Object.keys(next)) {
          if (merged[k] !== next[k]) {
            merged[k] = next[k];
            changed = true;
          }
        }
        return changed ? merged : prev;
      });
    }

    // initial fetch
    fetchStatuses();

    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchStatuses, POLL_SERVER_MS);
    return () => clearInterval(pollingRef.current);
  }, [sessions]);

  /* ---------- combined status function ---------- */
  const effectiveStatus = useCallback(
    (s) => {
      const server = serverStatuses[s._id];
      if (server && server !== "unknown") {
        if (server === "live")
          return {
            state: "live",
            startedAt: s.startedAt
              ? new Date(s.startedAt).getTime()
              : parseSessionDate(s.date)?.getTime(),
          };
        if (server === "ended") return { state: "ended" };
        return {
          state: "upcoming",
          startsAt: s.date ? parseSessionDate(s.date).getTime() : undefined,
        };
      }
      return clientStatusFromDate(s.date, s.durationMin || 60);
    },
    [serverStatuses]
  );

  /* ---------- grouping (memoized) ---------- */
  const grouped = useMemo(() => {
    const live = [];
    const upcoming = [];
    const ended = [];
    for (const s of sessions) {
      const st = effectiveStatus(s).state;
      if (st === "live") live.push(s);
      else if (st === "upcoming") upcoming.push(s);
      else if (st === "ended") ended.push(s);
      else upcoming.push(s);
    }
    return { live, upcoming, ended };
  }, [sessions, effectiveStatus]);

  /* ---------- copy link + notifications ---------- */
  const copyLink = useCallback(
    async (link) => {
      if (!link) return toastInfo("No link available");
      try {
        await navigator.clipboard.writeText(link);
        toastInfo("Link copied to clipboard");
      } catch {
        toastInfo("Failed to copy");
      }
    },
    [toastInfo]
  );

  /* ---------- small status pill ---------- */
  const StatusPill = useCallback(
    (s) => {
      const st = effectiveStatus(s).state;
      if (st === "live")
        return (
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-green-100 to-green-50 text-green-700 text-xs font-semibold">
            Live
          </span>
        );
      if (st === "upcoming") {
        const startsAt =
          effectiveStatus(s).startsAt ??
          (s.date ? parseSessionDate(s.date).getTime() : null);
        const mins = startsAt
          ? Math.max(0, Math.round((startsAt - Date.now()) / 60000))
          : null;
        return (
          <span className="px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-900 text-yellow-700 text-xs font-medium">
            {mins != null ? `Starts in ${mins}m` : "Upcoming"}
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 text-xs">
          Ended
        </span>
      );
    },
    [effectiveStatus]
  );

  function toGoogleDate(date) {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function getGoogleCalendarLink(session) {
    const start = toGoogleDate(session.date);

    // Default 1 hour duration
    const end = toGoogleDate(
      new Date(new Date(session.date).getTime() + 60 * 60 * 1000)
    );

    const title = encodeURIComponent(session.title);
    const details = encodeURIComponent(`Join Live Session:\n${session.link}`);
    const location = encodeURIComponent(session.link);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  }

  /* ---------- Session Card (stable) ---------- */
  const SessionCard = useCallback(
    ({ s }) => {
      const status = effectiveStatus(s);
      const live = status.state === "live";
      const upcoming = status.state === "upcoming";
      const ended = status.state === "ended";

      const startedByLabel = s.startedByName || null;
      const endedByLabel = s.endedByName || null;

      const presenceText = live
        ? `Started by ${startedByLabel || "Instructor"}`
        : ended
        ? `Ended by ${endedByLabel || "Instructor"}`
        : "";

      /* --- 🔥 Countdown Timer for upcoming sessions --- */
      const startsAt = parseSessionDate(s.date)?.getTime();
      const minsLeft = upcoming
        ? Math.max(0, Math.round((startsAt - Date.now()) / 60000))
        : null;

      /* --- 🔥 Auto-scroll to live section --- */
      useEffect(() => {
        if (live) {
          setTimeout(() => {
            const el = document.getElementById(`session-${s._id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      }, [live]);

      return (
        <motion.div
          id={`session-${s._id}`}
          key={s._id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md shadow-sm hover:shadow-lg transition-all p-4"
        >
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0 flex gap-3">
              {/* ICON */}
              <div className="flex-shrink-0 rounded-xl w-12 h-12 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-semibold shadow-sm">
                {String(s.title || "S")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold truncate text-slate-900 dark:text-white">
                  {s.title}
                </h4>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
                  {s.description || "No description provided."}
                </p>

                {/* Countdown + Time */}
                <div className="mt-2 flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <HiOutlineCalendarDays className="w-4 h-4" />
                    <span>{shortTimeLabel(parseSessionDate(s.date))}</span>
                  </div>

                  {upcoming && (
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded-full text-yellow-700 dark:text-yellow-300 text-xs">
                      <HiOutlineBell className="w-4 h-4" />
                      <span>{minsLeft} min left</span>
                    </div>
                  )}

                  {live && (
                    <div className="flex items-center gap-2 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_2px_rgba(255,0,0,0.7)]"></span>
                      <span className="text-red-500 font-semibold text-xs">
                        LIVE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden sm:block">{StatusPill(s)}</div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex items-center justify-end gap-3 mt-4">
            {/* JOIN BUTTON */}
            <a
              href={live ? s.link : "#"}
              target={live ? "_blank" : "_self"}
              onClick={(e) => !live && e.preventDefault()}
              className={`
      inline-flex items-center justify-center 
      gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold 
      transition shadow-sm w-auto min-w-[120px]
      ${
        live
          ? "bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:brightness-110"
          : ended
          ? "bg-slate-200 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 cursor-default"
          : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white border"
      }
    `}
            >
              {live ? "Join Now" : ended ? "Completed" : "Waiting"}
            </a>

            {/* REMINDER BUTTON ONLY UPCOMING */}
            {upcoming && (
              <a
                href={getGoogleCalendarLink(s)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center 
                 gap-2 px-4 py-2.5 bg-blue-600 text-white 
                 rounded-lg hover:bg-blue-700 text-sm shadow w-auto min-w-[180px]"
              >
                Add Reminder
              </a>
            )}
          </div>

          {/* FOOTER */}
          {(live || ended) && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
                {(startedByLabel || endedByLabel || "A")[0].toUpperCase()}
              </div>
              <span>{presenceText}</span>
            </div>
          )}
        </motion.div>
      );
    },
    [StatusPill, effectiveStatus]
  );

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-[#071022] dark:to-[#071421] py-10 px-4 sm:px-8">
      {/* Toast area */}
      <div className="fixed right-4 top-5 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-black/80 text-white px-4 py-2 rounded-md text-sm shadow-lg"
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <HiOutlineVideoCamera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Live Sessions
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Real-time updates • Join instantly when your instructor starts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if ("Notification" in window) {
                  Notification.requestPermission().then((p) =>
                    toastInfo(
                      "Notifications " +
                        (p === "granted" ? "allowed" : "not allowed")
                    )
                  );
                } else toastInfo("Notifications not supported");
              }}
              className="px-3 py-2 rounded-md bg-white dark:bg-slate-800 border shadow-sm text-sm"
            >
              Enable notifications
            </button>

            <button
              onClick={() => {
                setLoading(true);
                api
                  .get("/student/live-sessions")
                  .then((res) => {
                    const arr = Array.isArray(res.data) ? res.data : [];
                    arr.sort((a, b) => new Date(a.date) - new Date(b.date));
                    setSessions(arr);
                    setLoading(false);
                    toastInfo("Refreshed");
                  })
                  .catch(() => {
                    setLoading(false);
                    toastInfo("Refresh failed");
                  });
              }}
              className="px-3 py-2 rounded-md bg-indigo-600 text-white shadow-md text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Live */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Live
            </h2>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {grouped.live.length} live
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {grouped.live.length > 0 ? (
                grouped.live.map((s) => <SessionCard key={s._id} s={s} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-500"
                >
                  No live sessions right now.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Upcoming */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Upcoming
            </h2>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {grouped.upcoming.length} upcoming
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {grouped.upcoming.length > 0 ? (
                grouped.upcoming.map((s) => <SessionCard key={s._id} s={s} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-500"
                >
                  No upcoming sessions.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Previously joined */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Previously Joined
            </h2>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {grouped.ended.length} total
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {grouped.ended.length > 0 ? (
                grouped.ended.map((s) => <SessionCard key={s._id} s={s} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-500"
                >
                  No previously joined sessions yet.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* empty state */}
        {!loading && sessions.length === 0 && (
          <div className="text-center mt-8">
            <HiOutlineCalendarDays className="mx-auto w-16 h-16 text-slate-300" />
            <div className="mt-3 text-slate-600">No sessions scheduled.</div>
          </div>
        )}
      </div>
    </div>
  );
}
