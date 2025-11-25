import mongoose from "mongoose";

const tradeJournalSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    instrument: {
      type: String,
      required: true,
      enum: ["Gold", "Bitcoin", "Ethereum", "Nifty", "BankNifty", "Crude Oil"],
    },

    entryPrice: {
      type: Number,
      required: true,
    },

    exitPrice: {
      type: Number,
      required: true,
    },

    result: {
      type: String,
      enum: ["profit", "loss"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      enum: ["ounce", "lots"],
      required: true,
    },

    tradeType: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    datetime: {
      type: String,
      required: true,
    },
    screenshot: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TradeJournal", tradeJournalSchema);
