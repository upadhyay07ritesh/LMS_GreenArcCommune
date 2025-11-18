import TradeJournal from "../models/TradeJournal.js";

export const createTradeEntry = async (req, res) => {
  try {
    const {
      studentId,
      instrument,
      entryPrice,
      exitPrice,
      result,
      amount,
      quantity,
      unit,
      description,
      datetime,
    } = req.body;

    // Required field check
    if (
      !studentId ||
      !instrument ||
      !entryPrice ||
      !exitPrice ||
      !result ||
      !amount ||
      !quantity ||
      !unit ||
      !datetime
    ) {
      return res.status(400).json({
        message: "All required fields must be filled.",
      });
    }
    const screenshotPath = req.file
      ? `/uploads/trades/${req.file.filename}`
      : null;

    if (!screenshotPath) {
      return res.status(400).json({ message: "Screenshot is required" });
    }
    const trade = await TradeJournal.create({
      studentId,
      instrument,
      entryPrice,
      exitPrice,
      result,
      amount,
      quantity,
      unit,
      description,
      datetime,
      screenshot: screenshotPath,
    });

    res.status(201).json({
      message: "Trade journal entry created successfully.",
      trade,
    });
  } catch (error) {
    console.error("Error creating trade entry:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all trades for logged-in student
export const getMyTrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    const trades = await TradeJournal.find({ studentId }).sort({
      createdAt: -1,
    });

    res.status(200).json(trades);
  } catch (error) {
    console.error("Error fetching trades:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single trade by ID
export const getTradeById = async (req, res) => {
  try {
    const trade = await TradeJournal.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    res.json(trade);
  } catch (error) {
    console.error("Error fetching trade:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete trade entry
export const deleteTrade = async (req, res) => {
  try {
    const trade = await TradeJournal.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ message: "Trade not found" });
    }

    if (trade.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await trade.deleteOne();

    res.json({ message: "Trade entry deleted" });
  } catch (error) {
    console.error("Error deleting trade:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
