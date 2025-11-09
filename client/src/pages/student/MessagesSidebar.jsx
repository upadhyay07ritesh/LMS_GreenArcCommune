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

  // 🔊 Load sound preference
  useEffect(() => {
    const saved = localStorage.getItem("soundEnabled");
    if (saved !== null) setSoundEnabled(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("soundEnabled", String(soundEnabled));
  }, [soundEnabled]);

  // 🚫 Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // ⌨️ ESC key to close
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
      { toastId: `msg-${msg.id}` }
    );
    playSound();
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages");
      const data = Array.isArray(res.data) ? res.data : [];
      setMessages(data);

      const newUnread = data.filter((m) => !m.read && !seenIdsRef.current.has(m.id));
      seenIdsRef.current = new Set([...seenIdsRef.current, ...data.map((m) => m.id)]);
      if (document.visibilityState === "visible") newUnread.forEach(notifyNewMessage);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = messages.filter((m) => !m.read).length;

  const markAllAsRead = async () => {
    try {
      await api.patch("/messages/mark-all-read");
      setMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
      toast.success("All messages marked as read ✅");
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/messages/${id}`, { read: true });
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, read: true } : msg)));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return (
    <>
      {/* 💬 Floating Green Message Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          fixed
          top-1/2 -translate-y-1/2
          right-0 z-[9997]
          bg-green-600 hover:bg-green-700
          text-white shadow-xl rounded-s-none
          px-4 py-4
          flex items-center justify-center
          rounded-l-2xl
        "
        style={{
          borderTopLeftRadius: "16px",
          borderBottomLeftRadius: "16px",
        }}
      >
        <HiChatBubbleOvalLeftEllipsis className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 left-2 w-4 h-4 bg-red-500 text-[10px] flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* 💬 Sidebar Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            />

            {/* Sidebar Panel */}
            <motion.aside
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="
                fixed inset-y-0 right-0
                w-[50vw] max-w-[480px] min-w-[320px]
                bg-white dark:bg-slate-900
                shadow-2xl border-l border-slate-200 dark:border-slate-700
                flex flex-col z-[9999]
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Messages
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Sound Toggle */}
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

                  {/* Mark All */}
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-green-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}

                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <HiXMark className="w-6 h-6 text-slate-700 dark:text-slate-200" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <p className="text-center text-slate-400 py-6">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400 py-6">No messages</p>
                ) : (
                  messages.map((msg, i) => (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleMarkAsRead(msg.id)}
                      className={`px-4 py-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        msg.read ? "" : "bg-green-50/70 dark:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <HiUserCircle className="text-green-600 text-2xl flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">
                            {msg.title || "Message from Admin"}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                            {msg.body}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-slate-400">
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleString()
                                : "Just now"}
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
