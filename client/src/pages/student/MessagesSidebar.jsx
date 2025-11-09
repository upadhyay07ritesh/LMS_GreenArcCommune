import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineEnvelopeOpen,
  HiUserCircle,
  HiSpeakerWave,
  HiSpeakerXMark,
  HiXMark,
  HiChatBubbleOvalLeftEllipsis,
} from "react-icons/hi2";
import { toast } from "react-toastify";
import api from "../../api/axios.js";
import dingSound from "../../assets/notification.mp3";

export default function MessagesSidebar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const seenIdsRef = useRef(new Set());
  const audioRef = useRef(typeof Audio !== "undefined" ? new Audio(dingSound) : null);

  // 🔊 Load sound setting
  useEffect(() => {
    const saved = localStorage.getItem("soundEnabled");
    if (saved !== null) setSoundEnabled(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem("soundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  // 🚫 Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // ESC key
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const notifyNewMessage = (msg) => {
    toast.info(
      <div className="cursor-pointer" onClick={() => setOpen(true)}>
        <div className="font-semibold">{msg.title || "Message from Admin"}</div>
        <div className="text-sm opacity-90">{msg.body?.slice(0, 100)}</div>
      </div>,
      { toastId: `msg-${msg._id}` }
    );
    playSound();
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages/student/inbox");
      const data = Array.isArray(res.data) ? res.data.reverse() : [];
      setMessages(data);

      const newUnread = data.filter(
        (m) => !m.read && !seenIdsRef.current.has(m._id)
      );
      seenIdsRef.current = new Set([...seenIdsRef.current, ...data.map((m) => m._id)]);
      if (document.visibilityState === "visible" && newUnread.length > 0)
        newUnread.forEach(notifyNewMessage);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = messages.filter((m) => !m.read).length;

  const markAllAsRead = async () => {
    try {
      await api.patch("/messages/student/mark-all-read");
      setMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
      toast.success("All messages marked as read ✅");
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/messages/student/${id}/read`);
      setMessages((prev) =>
        prev.map((msg) => (msg._id === id ? { ...msg, read: true } : msg))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return (
    <>
      {/* 💬 Floating Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-[9997]
          bg-green-600 hover:bg-green-700 text-white shadow-xl
          rounded-l-2xl px-4 py-4"
      >
        <HiChatBubbleOvalLeftEllipsis className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 left-2 w-4 h-4 bg-red-500 text-[10px] flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-y-0 right-0 w-[50vw] max-w-[480px] min-w-[320px]
                bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col z-[9999]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Notifications
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSoundEnabled((v) => !v)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {soundEnabled ? (
                      <HiSpeakerWave className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    ) : (
                      <HiSpeakerXMark className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    )}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <HiXMark className="w-6 h-6 text-slate-700 dark:text-white" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <p className="text-center text-slate-400 py-6">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No messages yet</p>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={msg._id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleMarkAsRead(msg._id)}
                      className={`border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer ${
                        msg.read
                          ? "bg-slate-50 dark:bg-slate-800"
                          : "bg-green-50 dark:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <HiUserCircle className="text-green-600 text-2xl" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 dark:text-white truncate">
                            {msg.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {msg.body}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-slate-400">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                            {msg.read ? (
                              <HiOutlineEnvelopeOpen className="text-slate-400 w-4 h-4" />
                            ) : (
                              <HiOutlineEnvelope className="text-green-600 w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
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
