// server/src/controllers/liveSessions.controller.js
import { LiveSession } from "../models/LiveSessions.js";
import { scheduleEmailReminder } from "../utils/sessionScheduler.js";

/**
 * Helper for broadcasting
 */
function broadcast(req, event, payload) {
  try {
    const io = req.app && req.app.get && req.app.get("io");
    if (io && typeof io.emit === "function") io.emit(event, payload);
  } catch (e) {
    console.warn("Broadcast failed:", e?.message || e);
  }
}

/**
 * START LIVE SESSION
 */
export const startLiveSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Session ID is required" });

    const session = await LiveSession.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "live")
      return res.status(400).json({ message: "Session is already live" });

    const adminId = req.user?._id ?? null;
    const adminName = req.user?.name ?? "Admin";

    session.endedBy = undefined;
    session.endedByName = undefined;
    session.endedAt = undefined;

    session.status = "live";
    session.startedBy = adminId;
    session.startedByName = adminName;
    session.startedAt = new Date();

    await session.save();

    broadcast(req, "live:sessionStarted", {
      id: session._id,
      session: session.toObject(),
      status: "live",
    });

    // ❌ REMOVE THIS — WRONG LOGIC
    // scheduleEmailReminder(session);

    return res.json({ message: "Session started", session });

  } catch (err) {
    console.error("❌ Start Session Error:", err);
    return res.status(500).json({ message: "Failed to start session" });
  }
};



/**
 * END LIVE SESSION
 */
export const endLiveSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Session ID is required" });

    const session = await LiveSession.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status === "ended")
      return res.status(400).json({ message: "Session already ended" });

    const adminId = req.user?._id ?? null;
    const adminName = req.user?.name ?? "Admin";

    session.status = "ended";
    session.endedBy = adminId;
    session.endedByName = adminName;
    session.endedAt = new Date();

    await session.save();

    // broadcast
    broadcast(req, "live:sessionEnded", { id: session._id, session: session.toObject(), status: "ended" });

    return res.json({ message: "Session ended", session });
  } catch (err) {
    console.error("❌ End Session Error:", err);
    return res.status(500).json({ message: "Failed to end session" });
  }
};

/**
 * MANUAL SET STATUS (admin)
 * Body: { status: 'live'|'paused'|'cancelled'|'ended'|'upcoming' }
 */
export const setLiveSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) return res.status(400).json({ message: "Session ID required" });
    if (!status) return res.status(400).json({ message: "Status required" });

    const allowed = ["upcoming", "live", "paused", "cancelled", "ended"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const session = await LiveSession.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const adminId = req.user?._id ?? null;
    const adminName = req.user?.name ?? "Admin";

    // update metadata depending on status
    if (status === "live") {
      session.startedBy = adminId;
      session.startedByName = adminName;
      session.startedAt = session.startedAt || new Date();
    }
    if (status === "ended") {
      session.endedBy = adminId;
      session.endedByName = adminName;
      session.endedAt = session.endedAt || new Date();
    }

    session.status = status;
    await session.save();

    // broadcast a generic status update
    broadcast(req, "live:sessionStatusUpdated", { id: session._id, session: session.toObject(), status });

    return res.json({ message: "Status updated", session });
  } catch (err) {
    console.error("❌ Set Status Error:", err);
    return res.status(500).json({ message: "Failed to set status" });
  }
};

/**
 * GET LIVE SESSION STATUS (student fallback)
 */
export const getLiveSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ status: "unknown", message: "ID required" });

    const s = await LiveSession.findById(id).select("status startedByName endedByName startedAt endedAt");
    if (!s) return res.status(404).json({ status: "unknown" });

    return res.json({
      status: s.status,
      startedByName: s.startedByName,
      endedByName: s.endedByName,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
    });
  } catch (err) {
    console.error("❌ Status Error:", err);
    return res.status(500).json({ status: "unknown" });
  }
};

export const createLiveSession = async (req, res) => {
  try {
    const payload = req.body;

    // Create session
    const session = await LiveSession.create(payload);

    // Schedule email 30 minutes before session start
    scheduleEmailReminder(session);

    // Broadcast new session to all clients
    broadcast(req, "live:sessionCreated", {
      session: session.toObject(),
    });

    return res.status(201).json(session);
  } catch (err) {
    console.error("❌ Create Live Session Error:", err);
    return res.status(500).json({ message: "Failed to create live session" });
  }
};