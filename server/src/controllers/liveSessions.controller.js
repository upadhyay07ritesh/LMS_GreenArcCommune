  import { LiveSession } from "../models/LiveSessions.js";

  /**
   * START LIVE SESSION
   */
  export const startLiveSession = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id)
        return res.status(400).json({ message: "Session ID is required" });

      const session = await LiveSession.findById(id);

      if (!session)
        return res.status(404).json({ message: "Session not found" });

      if (session.status === "live")
        return res.status(400).json({ message: "Session is already live" });

      if (session.status === "ended")
        return res.status(400).json({ message: "Cannot start — session already ended" });

      session.status = "live";
      await session.save();

      return res.json({
        message: "Session started",
        session,
      });
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

      if (!id)
        return res.status(400).json({ message: "Session ID is required" });

      const session = await LiveSession.findById(id);

      if (!session)
        return res.status(404).json({ message: "Session not found" });

      if (session.status === "ended")
        return res.status(400).json({ message: "Session already ended" });

      session.status = "ended";
      await session.save();

      return res.json({
        message: "Session ended",
        session,
      });
    } catch (err) {
      console.error("❌ End Session Error:", err);
      return res.status(500).json({ message: "Failed to end session" });
    }
  };


  /**
   * GET LIVE SESSION STATUS
   * Returns: { status: "upcoming" | "live" | "ended" }
   */
  export const getLiveSessionStatus = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id)
        return res.status(400).json({ status: "unknown", message: "ID required" });

      const s = await LiveSession.findById(id).select("status");

      if (!s)
        return res.status(404).json({ status: "unknown" });

      return res.json({ status: s.status });
    } catch (err) {
      console.error("❌ Status Error:", err);
      return res.status(500).json({ status: "unknown" });
    }
  };
