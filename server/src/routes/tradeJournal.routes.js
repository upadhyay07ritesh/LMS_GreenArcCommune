import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import {
  createTradeEntry,
  getMyTrades,
  getTradeById,
  deleteTrade,
} from "../controllers/TradeJournal.controller.js";

const router = express.Router();

// Create a new trade entry
router.post(
  "/create",
  protect,
  authorize("student"),
  upload.single("screenshot"),
  createTradeEntry
);
// Get logged-in student's trades
router.get("/my-trades", protect, authorize("student"), getMyTrades);

// Get one trade entry
router.get("/:id", protect, authorize("student"), getTradeById);

// Delete trade entry
router.delete("/:id", protect, authorize("student"), deleteTrade);

export default router;
