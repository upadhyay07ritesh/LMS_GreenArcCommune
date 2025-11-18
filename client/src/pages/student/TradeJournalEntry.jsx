// Full React component rewritten with Redux auth, attractive & responsive UI
// Added: small live summary panel, framer-motion micro-animations, and success animation.
// You may adjust imports (api path, Redux slices) according to your project structure.

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatISO } from "date-fns";
import { motion } from "framer-motion";
import api from "../../api/axios";
import { toast } from "react-toastify";

// Icons
import {
  FaDollarSign,
  FaRegClock,
  FaFileAlt,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";
import { MdOutlinePriceChange } from "react-icons/md";
import { GiGoldBar } from "react-icons/gi";

const INSTRUMENTS = [
  "Gold",
  "Bitcoin",
  "Ethereum",
  "Nifty",
  "BankNifty",
  "Crude Oil",
];

const containerAnim = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const TradeJournalEntry = () => {
  const navigate = useNavigate();
  // FIX: ensure correct user retrieval from Redux
  const { user } = useSelector((state) => state.auth);
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);

  const [unit, setUnit] = useState("ounce");
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      instrument: "Gold",
      entryPrice: "",
      exitPrice: "",
      result: "profit",
      amount: "",
      quantity: "",
      description: "",
      datetime: formatISO(new Date(), { representation: "complete" }).slice(
        0,
        16
      ),
    },
  });

  const watched = watch();
  const result = watched.result;

  const placeholderAmount =
    result === "profit" ? "Enter Profit Amount" : "Enter Loss Amount";

  // estimated pnl purely for display (not saved back or used to overwrite amount)
  const estimatedPnL = () => {
    const e = parseFloat(watched.entryPrice);
    const x = parseFloat(watched.exitPrice);
    const q = parseFloat(watched.quantity);
    if (!isNaN(e) && !isNaN(x) && !isNaN(q)) {
      return ((x - e) * q).toFixed(2);
    }
    return null;
  };
  const handleScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    if (!user?.id) {
      toast.error("You must be logged in to save a trade.");
      return;
    }

    const formData = new FormData();

    formData.append("studentId", user.id);
    formData.append("instrument", data.instrument);
    formData.append("entryPrice", data.entryPrice);
    formData.append("exitPrice", data.exitPrice);
    formData.append("result", data.result);
    formData.append("amount", data.amount);
    formData.append("quantity", data.quantity);
    formData.append("unit", unit);
    formData.append("description", data.description || "");
    formData.append("datetime", data.datetime);

    if (!screenshot) {
      toast.error("Screenshot is required");
      return;
    }

    formData.append("screenshot", screenshot);

    try {
      await api.post("/journals/trade/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowSuccess(true);
      toast.success("Trade entry saved successfully!");
      setTimeout(() => {
        setShowSuccess(false);
        reset();
        setUnit("ounce");
        navigate("/student/trade-entries");
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save trade entry");
    }
  };

  const blockMinus = (e) => {
    const invalidKeys = ["-", "+", "e", "E"];
    if (invalidKeys.includes(e.key)) {
      e.preventDefault();
    }
  };
  const blockPasteNegative = (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData("text");
    if (paste.includes("-") || paste.includes("e") || paste.includes("+")) {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-green-100 p-4 md:p-10 flex justify-center items-start">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <motion.div
          className="col-span-2 bg-white shadow-2xl rounded-2xl p-8 border border-gray-200"
          initial="hidden"
          animate="show"
          variants={containerAnim}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <GiGoldBar className="text-green-700 text-4xl" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
                Trade Journal Entry
              </h1>
              <p className="text-sm text-gray-500">
                Student ID: {user?.studentId}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* INSTRUMENT */}
            <motion.div whileHover={{ y: -3 }} className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaChartLine /> Instrument
              </label>
              <select
                {...register("instrument", { required: true })}
                className="mt-2 p-3 border rounded-xl shadow-sm hover:shadow-md transition focus:ring-2 focus:ring-green-500"
              >
                {INSTRUMENTS.map((ins) => (
                  <option key={ins} value={ins}>
                    {ins}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Entry & Exit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -3 }}>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MdOutlinePriceChange /> Entry Price
                </label>
                <input
                  type="number"
                  onKeyDown={blockMinus}
                  onPaste={blockPasteNegative}
                  min="0"
                  step="0.01"
                  {...register("entryPrice", {
                    required: true,
                    min: {
                      value: 0,
                      message: "Entry price cannot be negative",
                    },
                  })}
                  className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500"
                />
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MdOutlinePriceChange /> Exit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  onKeyDown={blockMinus}
                  onPaste={blockPasteNegative}
                  {...register("exitPrice", {
                    required: true,
                    min: { value: 0, message: "Exit price cannot be negative" },
                  })}
                  className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500"
                />
              </motion.div>
            </div>

            {/* Quantity */}
            <motion.div whileHover={{ y: -3 }}>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FaDollarSign /> Quantity
              </label>

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setUnit("ounce")}
                  className={`px-4 py-2 rounded-lg border transition ${
                    unit === "ounce"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Ounce
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("lots")}
                  className={`px-4 py-2 rounded-lg border transition ${
                    unit === "lots"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Lots
                </button>
              </div>

              <input
                type="number"
                step="0.01"
                onKeyDown={blockMinus}
                onPaste={blockPasteNegative}
                min="0"
                placeholder={`Enter quantity in ${unit}s`}
                {...register("quantity", {
                  required: true,
                  min: { value: 0, message: "Quantity cannot be negative" },
                })}
                className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500"
              />
            </motion.div>

            {/* Result & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -3 }}>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaDollarSign /> Result
                </label>
                <div className="flex gap-6 mt-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="profit"
                      {...register("result")}
                    />{" "}
                    Profit
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="loss" {...register("result")} />{" "}
                    Loss
                  </label>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaDollarSign /> Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={placeholderAmount}
                  {...register("amount", {
                    required: true,
                    validate: (val) => {
                      if (result === "profit" && val < 0)
                        return "Profit cannot be negative";
                      if (result === "loss" && val > 0)
                        return "Loss cannot be positive";
                      return true;
                    },
                  })}
                  className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Editable: amount won't be overwritten by the app.
                </p>
              </motion.div>
            </div>

            {/* Date & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div whileHover={{ y: -3 }}>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaRegClock /> Date & Time
                </label>
                <input
                  type="datetime-local"
                  {...register("datetime", { required: true })}
                  className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500"
                />
              </motion.div>

              <motion.div whileHover={{ y: -3 }}>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaFileAlt /> Description (optional)
                </label>
                <textarea
                  rows={4}
                  {...register("description")}
                  className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500"
                  placeholder="Add notes about this trade..."
                />
              </motion.div>
            </div>
            {/* Screenshot Upload */}
            <motion.div whileHover={{ y: -3 }}>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Screenshot (required)
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshot}
                className="mt-2 w-full p-3 border rounded-xl shadow-sm hover:shadow-md bg-white focus:ring-2 focus:ring-green-500"
              />

              {preview && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img
                    src={preview}
                    alt="Screenshot Preview"
                    className="w-full max-h-64 object-cover rounded-xl shadow-sm border"
                  />
                </div>
              )}

              {!screenshot && (
                <p className="text-xs text-red-600 mt-1">
                  * Screenshot is mandatory
                </p>
              )}
            </motion.div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => reset()}
                className="px-6 py-2 bg-gray-200 rounded-lg shadow hover:bg-gray-300"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700"
              >
                {isSubmitting ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </form>

          {/* small success overlay */}
          {showSuccess && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="fixed bottom-8 right-8 bg-white border border-green-200 rounded-xl p-4 shadow-lg flex items-center gap-3"
            >
              <FaCheckCircle className="text-green-600 text-2xl" />
              <div>
                <div className="font-semibold">Saved</div>
                <div className="text-xs text-gray-500">
                  Your trade entry was saved successfully
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Right-side Summary Panel */}
        <motion.aside
          className="bg-white shadow-xl rounded-2xl p-6 border border-gray-200 lg:sticky lg:top-24"
          initial="hidden"
          animate="show"
          variants={containerAnim}
        >
          <h3 className="text-lg font-bold text-gray-800 mb-3">
            Trade Summary
          </h3>

          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Instrument</span>
              <span className="font-medium">{watched.instrument || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Entry</span>
              <span className="font-medium">{watched.entryPrice || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Exit</span>
              <span className="font-medium">{watched.exitPrice || "—"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Quantity</span>
              <span className="font-medium">
                {watched.quantity ? `${watched.quantity} ${unit}` : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Estimated P&L</span>
              <span
                className={`font-semibold ${
                  estimatedPnL() && Number(estimatedPnL()) >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {estimatedPnL() ?? "—"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Result</span>
              <span className="font-medium capitalize">
                {watched.result || "—"}
              </span>
            </div>

            <div className="mt-4">
              <label className="text-xs text-gray-500">Description</label>
              <div className="mt-1 text-sm text-gray-700 p-3 rounded-md bg-gray-50 min-h-[56px]">
                {watched.description || "No notes"}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
};

export default TradeJournalEntry;
