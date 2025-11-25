import express from "express";
import Video from "../models/Video.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// ADD VIDEO - Only Admin
router.post("/videos/add", protect, authorize("admin"), async (req, res) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL VIDEOS
router.get("/", protect, async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET SINGLE VIDEO
router.get("/:id", protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    res.json(video);
  } catch (err) {
    res.status(404).json({ message: "Video not found" });
  }
});

// DELETE VIDEO
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(404).json({ message: "Video not found" });
  }
});

export default router;
