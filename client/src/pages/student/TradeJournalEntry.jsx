// TradeJournalEntry.jsx

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatISO } from "date-fns";
import { motion } from "framer-motion";
import api from "../../api/axios";
import { toast } from "react-toastify";

import { FaCheckCircle } from "react-icons/fa";
import { GiGoldBar } from "react-icons/gi";
import { HiArrowLeft } from "react-icons/hi";

const INSTRUMENTS = ["Gold", "Bitcoin", "Ethereum", "Crude Oil"];

const containerAnim = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.02 } },
};

/* ------------------------------ */
/* Field Component */
/* ------------------------------ */
const Field = React.memo(({ label, children }) => (
  <div className="w-full">
    <div className="text-xs text-gray-500 mb-2">{label}</div>
    {children}
  </div>
));

/* ------------------------------ */
/* QUANTITY SELECTOR */
/* ------------------------------ */
const QuantitySelector = React.memo(
  ({ unit, setUnit, quantity, setQuantity }) => {
    const step = unit === "ounce" ? 1 : 0.01;

    const handleManual = (e) => {
      let val = e.target.value;

      if (unit === "ounce") {
        val = val.replace(/\D/g, "");
        if (!val) val = "1";
      }

      if (unit === "lots") {
        val = val.replace(/[^0-9.]/g, "");
        if (val.includes(".")) {
          const [i, d] = val.split(".");
          val = i + "." + (d?.slice(0, 2) ?? "");
        }
      }

      setQuantity(val);
    };

    const increment = () => {
      setQuantity((q) => {
        let next = parseFloat(q) + step;
        if (unit === "lots") next = next.toFixed(2);
        return String(next);
      });
    };

    const decrement = () => {
      setQuantity((q) => {
        let next = parseFloat(q) - step;
        if (next < 0) next = 0;
        if (unit === "lots") next = next.toFixed(2);
        return String(next);
      });
    };

    const handleUnitSwitch = (newUnit) => {
      setUnit(newUnit);

      setQuantity((q) => {
        const num = parseFloat(q || "0");
        if (newUnit === "ounce") {
          return String(Math.max(1, Math.round(num * 100)));
        }
        if (newUnit === "lots") {
          return (num * 0.01).toFixed(2);
        }
      });
    };

    return (
      <div className="max-w-sm">
        <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide">
          Quantity
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          {/* Unit Switch */}
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => handleUnitSwitch("ounce")}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${
                unit === "ounce" ? "bg-green-600 text-white" : "text-gray-600"
              }`}
            >
              Troy Ounce
            </button>

            <button
              type="button"
              onClick={() => handleUnitSwitch("lots")}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${
                unit === "lots" ? "bg-green-600 text-white" : "text-gray-600"
              }`}
            >
              Lots
            </button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm font-medium">Qty</span>
              <input
                value={quantity}
                onChange={handleManual}
                className="w-24 px-2 py-1 border border-gray-200 rounded-md text-gray-900 text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={increment}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300"
              >
                +
              </button>

              <button
                type="button"
                onClick={decrement}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300"
              >
                –
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/* ------------------------------ */
/* MAIN COMPONENT */
/* ------------------------------ */
export default function TradeJournalEntry() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth || {});

  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [unit, setUnit] = useState("ounce");
  const [quantity, setQuantity] = useState("1");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { isSubmitting },
    watch,
  } = useForm({
    defaultValues: {
      instrument: "Gold",
      tradeType: "buy",
      entryPrice: "",
      exitPrice: "",
      quantity: quantity,
      unit: unit,
      result: "profit",
      amount: "",
      description: "",
      datetime: formatISO(new Date(), { representation: "complete" }).slice(
        0,
        16
      ),
    },
  });

  /* Watching Inputs */
  const watchedInstrument = useWatch({ control, name: "instrument" });
  const watchedEntry = useWatch({ control, name: "entryPrice" });
  const watchedExit = useWatch({ control, name: "exitPrice" });
  const watchedTradeType = useWatch({ control, name: "tradeType" });
  const watchedDescription = useWatch({ control, name: "description" });

  /* Sync quantity to form */
  useEffect(() => {
    setValue("quantity", quantity);
  }, [quantity, setValue]);

  // ENSURE tradeType ALWAYS added to RHF state
  useEffect(() => {
    if (!watchedTradeType) {
      setValue("tradeType", "buy");
    }
  }, [watchedTradeType, setValue]);

  /* Preview Cleanup */
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ------------------------------ */
  /* AUTO RESULT PROFIT OR LOSS */
  /* ------------------------------ */
  useEffect(() => {
    const entry = parseFloat(watchedEntry);
    const exit = parseFloat(watchedExit);
    const type = watchedTradeType;

    if (isNaN(entry) || isNaN(exit) || !type) return;

    let isProfit = false;

    if (type === "buy") {
      isProfit = exit > entry;
    } else if (type === "sell") {
      isProfit = exit < entry;
    }

    setValue("result", isProfit ? "profit" : "loss");
  }, [watchedEntry, watchedExit, watchedTradeType, setValue]);

  /* File Upload */
  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  /* ------------------------------ */
  /* Submit Handler */
  /* ------------------------------ */
  const onSubmit = async (form) => {
    if (!user?.id) {
      toast.error("You must be logged in.");
      return;
    }
    const fd = new FormData();
    console.log("TRADE TYPE BEFORE SUBMIT:", form.tradeType);
    fd.append("studentId", user.id);
    fd.append("instrument", form.instrument);
    fd.append("tradeType", form.tradeType);
    fd.append("entryPrice", form.entryPrice);
    fd.append("exitPrice", form.exitPrice);
    fd.append("result", form.result);
    fd.append("amount", form.amount);
    fd.append("quantity", quantity);
    fd.append("unit", unit);
    fd.append("description", form.description || "");
    fd.append("datetime", form.datetime);

    if (!screenshot) {
      toast.error("Screenshot is required");
      return;
    }

    fd.append("screenshot", screenshot);

    try {
      await api.post("/journals/trade/create", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowSuccess(true);
      toast.success("Trade entry saved!");

      setTimeout(() => {
        setShowSuccess(false);
        reset();
        setUnit("ounce");
        setQuantity("1");
        setScreenshot(null);
        setPreview(null);
        navigate("/student/trade-entries");
      }, 800);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save.");
    }
  };

  const blockMinus = (e) => {
    if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
  };

  /* ------------------------------ */
  /* RENDER UI */
  /* ------------------------------ */

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 m-4"
        >
          <HiArrowLeft className="w-5 h-5" /> Back
        </button>

        <motion.div
          initial="hidden"
          animate="show"
          variants={containerAnim}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* ----------------------------------------- */}
          {/* SUMMARY CARD */}
          {/* ----------------------------------------- */}
          <motion.aside
            className="lg:col-span-3 bg-white rounded-2xl p-6 shadow border sticky top-8"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center">
                <GiGoldBar className="text-2xl text-gray-800" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Trade Journal</div>
                <div className="text-lg font-semibold text-gray-900">
                  Summary
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-700 space-y-3">
              <Summary label="Instrument" value={watchedInstrument} />
              <Summary label="Entry" value={watchedEntry} />
              <Summary label="Exit" value={watchedExit} />
              <Summary
                label="Type"
                value={watchedTradeType ? watchedTradeType.toUpperCase() : "—"}
              />
              <Summary label="Quantity" value={`${quantity} ${unit}`} />

              <div>
                <div className="text-xs text-gray-500 mt-2">Notes</div>
                <div className="mt-2 p-3 rounded-lg bg-gray-50 text-sm text-gray-700 min-h-[66px]">
                  {watchedDescription || "No notes"}
                </div>
              </div>
            </div>

            {/* Screenshot preview */}
            <div className="mt-6">
              <div className="text-xs text-gray-500">Preview</div>
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-20 w-32 object-cover rounded-md border mt-2"
                />
              ) : (
                <div className="h-20 w-32 border rounded-md border-dashed text-xs text-gray-400 flex items-center justify-center mt-2">
                  No file
                </div>
              )}
            </div>
          </motion.aside>

          {/* ----------------------------------------- */}
          {/* FORM */}
          {/* ----------------------------------------- */}
          <motion.main
            className="lg:col-span-9 bg-white rounded-2xl p-8 shadow border"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl font-semibold text-gray-900">
              Trade Journal Entry
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Record a trade with notes and screenshot
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-6">
              {/* Instrument / Entry / Exit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Instrument">
                  <select
                    {...register("instrument")}
                    className="w-full bg-white border rounded-lg px-3 py-2"
                  >
                    {INSTRUMENTS.map((ins) => (
                      <option key={ins}>{ins}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Entry Price">
                  <input
                    type="number"
                    step="0.01"
                    {...register("entryPrice")}
                    onKeyDown={blockMinus}
                    className="w-full bg-white border rounded-lg px-3 py-2"
                  />
                </Field>

                <Field label="Exit Price">
                  <input
                    type="number"
                    step="0.01"
                    {...register("exitPrice")}
                    onKeyDown={blockMinus}
                    className="w-full bg-white border rounded-lg px-3 py-2"
                  />
                </Field>
              </div>

              {/* BUY / SELL */}
              <Field label="Trade Type">
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tradeType"
                      value="buy"
                      {...register("tradeType")}
                    />
                    Buy
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tradeType"
                      value="sell"
                      {...register("tradeType")}
                    />
                    Sell
                  </label>
                </div>
              </Field>

              {/* Quantity Selector */}
              <div>
                <QuantitySelector
                  unit={unit}
                  setUnit={setUnit}
                  quantity={quantity}
                  setQuantity={setQuantity}
                />
                <input
                  type="hidden"
                  {...register("quantity")}
                  value={quantity}
                />
              </div>

              {/* AUTO RESULT + MANUAL AMOUNT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AUTO RESULT */}
                <Field label="Result (Auto)">
                  <input
                    type="text"
                    value={watch("result") === "profit" ? "Profit" : "Loss"}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium"
                  />
                  <input type="hidden" {...register("result")} />
                </Field>

                {/* AMOUNT */}
                <Field label="Amount">
                  <input
                    type="number"
                    step="0.01"
                    {...register("amount")}
                    placeholder="Enter P/L amount"
                    className="w-full bg-white border rounded-lg px-3 py-2"
                  />
                </Field>
              </div>

              {/* Date + Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date & Time">
                  <input
                    type="datetime-local"
                    {...register("datetime")}
                    className="w-full bg-white border rounded-lg px-3 py-2"
                  />
                </Field>

                <Field label="Description (Optional)">
                  <textarea
                    rows={4}
                    {...register("description")}
                    className="w-full bg-white border rounded-lg px-3 py-2"
                  />
                </Field>
              </div>

              {/* Screenshot */}
              <div>
                <div className="text-xs text-gray-500 mb-2">
                  Screenshot (Required)
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshot}
                    className="text-sm"
                  />
                  {preview ? (
                    <img
                      src={preview}
                      className="h-20 w-32 object-cover rounded-md border"
                    />
                  ) : (
                    <div className="h-20 w-32 rounded-md border border-dashed text-xs text-gray-400 flex items-center justify-center">
                      No file
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setQuantity("1");
                    setUnit("ounce");
                    setPreview(null);
                    setScreenshot(null);
                  }}
                  className="px-5 py-2 rounded-md bg-white border border-gray-200"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-md bg-gray-900 text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>

            {/* Success Toast */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed right-6 bottom-6 bg-white border rounded-xl p-3 shadow flex items-center gap-2"
              >
                <FaCheckCircle className="text-emerald-500" />
                <span className="text-sm">Trade saved successfully!</span>
              </motion.div>
            )}
          </motion.main>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------ */
/* Summary Row Component */
/* ------------------------------ */
function Summary({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
