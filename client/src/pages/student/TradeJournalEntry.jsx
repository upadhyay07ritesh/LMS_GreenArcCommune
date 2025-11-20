// TradeJournalEntry.jsx
import React, { useEffect, useCallback } from "react";
import { useState } from "react";
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
/**
 * Local preview image.
 * Developer note: this is the local path you uploaded earlier.
 */
const INSTRUMENTS = ["Gold", "Bitcoin", "Ethereum", "Crude Oil"];

const containerAnim = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.02 } },
};

/* ------------------------------
   Memoized small components
   ------------------------------ */
const Field = React.memo(({ label, children, hint }) => (
  <div className="w-full">
    <div className="text-xs text-gray-500 mb-2">{label}</div>
    {children}
    {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
  </div>
));

const QuantitySelector = React.memo(
  ({ unit, setUnit, quantity, setQuantity }) => {
    const step = unit === "ounce" ? 1 : 0.01;

    const handleManual = (e) => {
      let val = e.target.value;

      if (unit === "ounce") {
        val = val.replace(/\D/g, "");
        if (val === "") val = "1";
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
          // convert lots → ounces
          return String(Math.max(1, Math.round(num * 100)));
        }

        if (newUnit === "lots") {
          // convert ounces → lots (must always be multiple of 0.01)
          return (num * 0.01).toFixed(2);
        }
      });
    };

    return (
      <div className="max-w-sm">
        <div className="text-xs text-gray-500 mb-2 font-medium tracking-wide">
          Quantity
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition-all duration-150 hover:shadow-md">
          {/* Toggle */}
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => handleUnitSwitch("ounce")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                unit === "ounce"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Troy Ounce
            </button>

            <button
              type="button"
              onClick={() => handleUnitSwitch("lots")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                unit === "lots"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Lots
            </button>
          </div>

          {/* Input + + / – */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm font-medium">Qty</span>
              <input
                value={quantity}
                onChange={handleManual}
                className="w-24 px-2 py-1 border border-gray-200 rounded-md text-gray-900 text-sm focus:outline-none focus:border-gray-900 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={increment}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
              >
                +
              </button>

              <button
                type="button"
                onClick={decrement}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
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

/* ------------------------------
   Main Component
   ------------------------------ */
export default function TradeJournalEntry() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth || {});

  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // quantity and unit are local UI states (string for stable formatting)
  const [unit, setUnit] = useState("ounce");
  const [quantity, setQuantity] = useState("1"); // default 1 ounce

  // react-hook-form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      instrument: "Gold",
      entryPrice: "",
      exitPrice: "",
      result: "profit",
      amount: "",
      quantity: quantity,
      description: "",
      datetime: formatISO(new Date(), { representation: "complete" }).slice(
        0,
        16
      ),
    },
    mode: "onTouched",
  });

  // useWatch selectively (avoids re-rendering entire form on each keystroke)
  const watchedInstrument = useWatch({ control, name: "instrument" });
  const watchedEntry = useWatch({ control, name: "entryPrice" });
  const watchedExit = useWatch({ control, name: "exitPrice" });
  const watchedResult = useWatch({ control, name: "result" });
  const watchedDescription = useWatch({ control, name: "description" });

  // Sync quantity to react-hook-form hidden field
  useEffect(() => {
    setValue("quantity", quantity);
  }, [quantity, setValue]);

  // cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const GOLD_MULTIPLIER = 100; // your multiplier

  const estimatedPnL = useCallback(() => {
    const e = parseFloat(watchedEntry);
    const x = parseFloat(watchedExit);
    const q = parseFloat(quantity);

    if (isNaN(e) || isNaN(x) || isNaN(q)) return null;

    const diff = x - e; // price difference

    // IMPORTANT FIX:
    const effectiveLots =
      unit === "ounce"
        ? q * 0.01 // convert ounce → lots
        : q; // already lots

    return (diff * GOLD_MULTIPLIER * effectiveLots).toFixed(2);
  }, [watchedEntry, watchedExit, quantity, unit]);

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const onSubmit = async (form) => {
    const finalQuantity = quantity ?? form.quantity ?? "0";

    if (!user?.id) {
      toast.error("You must be logged in to save a trade.");
      return;
    }

    const fd = new FormData();
    fd.append("studentId", user.id);
    fd.append("instrument", form.instrument);
    fd.append("entryPrice", form.entryPrice);
    fd.append("exitPrice", form.exitPrice);
    fd.append("result", form.result);
    fd.append("amount", form.amount);
    fd.append("quantity", finalQuantity);
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
      toast.success("Trade entry saved successfully!");

      setTimeout(() => {
        setShowSuccess(false);
        reset();
        setUnit("ounce");
        setQuantity("1");
        setScreenshot(null);
        setPreview(null);
        navigate("/student/trade-entries");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save trade entry");
    }
  };

  // prevent invalid characters in numeric fields
  const blockMinus = (e) => {
    if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
  };
  const blockPasteNegative = (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData("text");
    if (["-", "+", "e"].some((c) => paste.includes(c))) e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_100%)] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors m-4"
        >
          <HiArrowLeft className="w-5 h-5" />
          Back
        </button>
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerAnim}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Summary - reads only a few fields (via useWatch) */}
          <motion.aside
            className="lg:col-span-3 col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-8"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center">
                <GiGoldBar className="text-2xl text-gray-800" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Trade journal</div>
                <div className="text-lg font-semibold text-gray-900">
                  Quick summary
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Instrument</span>
                <span className="font-medium">{watchedInstrument || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Entry</span>
                <span className="font-medium">{watchedEntry || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Exit</span>
                <span className="font-medium">{watchedExit || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium">
                  {quantity} {unit}
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
                  {watchedResult || "—"}
                </span>
              </div>

              <div>
                <div className="text-xs text-gray-500 mt-2">Notes</div>
                <div className="mt-2 p-3 rounded-lg bg-gray-50 text-sm text-gray-700 min-h-[66px]">
                  {watchedDescription || "No notes"}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">Student</div>
              <div className="text-sm font-medium text-gray-900">
                {user?.name || user?.studentId || "—"}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs text-gray-500">Preview</div>
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="h-20 w-32 object-cover rounded-md border border-gray-100"
                />
              ) : (
                <div className="h-20 w-32 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  No file
                </div>
              )}
            </div>
          </motion.aside>

          {/* Form */}
          <motion.main
            className="lg:col-span-9 col-span-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Trade Journal Entry
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Record a trade with notes and screenshot
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-6 grid grid-cols-1 gap-6"
            >
              {/* Row: Instrument / Entry / Exit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <Field label="Instrument">
                  <select
                    {...register("instrument")}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
                  >
                    {INSTRUMENTS.map((ins) => (
                      <option key={ins} value={ins}>
                        {ins}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Entry Price">
                  <input
                    placeholder=" "
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("entryPrice")}
                    onKeyDown={blockMinus}
                    onPaste={blockPasteNegative}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
                  />
                </Field>

                <Field label="Exit Price">
                  <input
                    placeholder=" "
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("exitPrice")}
                    onKeyDown={blockMinus}
                    onPaste={blockPasteNegative}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
                  />
                </Field>
              </div>

              {/* Quantity selector - white style to match form */}
              <div>
                <QuantitySelector
                  unit={unit}
                  setUnit={setUnit}
                  quantity={quantity}
                  setQuantity={setQuantity}
                />
                {/* Hidden form field to keep react-hook-form aware of quantity */}
                <input
                  {...register("quantity")}
                  type="hidden"
                  value={quantity}
                />
              </div>

              {/* Result + Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Result</div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...register("result")}
                        value="profit"
                        defaultChecked
                      />{" "}
                      Profit
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...register("result")}
                        value="loss"
                      />{" "}
                      Loss
                    </label>
                  </div>
                </div>

                <Field
                  label="Amount"
                  hint="Editable: amount won't be overwritten by the app."
                >
                  <input
                    placeholder=" "
                    type="number"
                    step="0.01"
                    {...register("amount")}
                    onKeyDown={blockMinus}
                    onPaste={blockPasteNegative}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
                  />
                </Field>
              </div>

              {/* Date & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date & Time">
                  <input
                    placeholder=" "
                    type="datetime-local"
                    {...register("datetime")}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
                  />
                </Field>

                <Field label="Description (optional)">
                  <textarea
                    placeholder=" "
                    rows={4}
                    {...register("description")}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-900"
                  />
                </Field>
              </div>

              {/* Screenshot */}
              <div>
                <div className="text-xs text-gray-500 mb-2">
                  Screenshot (required)
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
                      alt="preview"
                      className="h-20 w-32 object-cover rounded-md border border-gray-100"
                    />
                  ) : (
                    <div className="h-20 w-32 rounded-md border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                      No file
                    </div>
                  )}
                </div>
                {!screenshot && (
                  <div className="text-xs text-red-600 mt-2">
                    * Screenshot is mandatory
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setQuantity("1");
                    setUnit("ounce");
                    setPreview(null);
                    setScreenshot(null);
                  }}
                  className="px-5 py-2 rounded-md bg-white border border-gray-200 text-sm"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-md bg-gray-900 text-white text-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>

            {/* success */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed right-6 bottom-6 bg-white border border-gray-100 rounded-xl p-3 shadow"
              >
                <FaCheckCircle className="text-emerald-500" />
                <div className="ml-2 text-sm">
                  Saved — Your trade entry was saved
                </div>
              </motion.div>
            )}
          </motion.main>
        </motion.div>
      </div>
    </div>
  );
}
