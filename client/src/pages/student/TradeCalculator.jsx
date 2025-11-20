import React, { useState } from "react";

/* =====================================================================
   MINIMAL TRADING PROFIT / LOSS CALCULATOR (REVERTED TO OLD CLEAN VERSION)
   - Inputs: Open Price, Close/Target Price, Quantity (lots)
   - Fixed Point Value = 100 USD per point per 1 lot
   - Simple Floating Button (Bottom Right)
   - Simple Modal (No draggable, no advanced features)
===================================================================== */

export default function TradingCalculatorModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button – Clean Old Version */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700"
      >
        Calculator
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-scaleIn">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
            <TradingProfitCalculator />
          </div>
        </div>
      )}
    </>
  );
}

// =============================
// SIMPLE PROFIT CALCULATOR — FIXED POINT VALUE
// =============================

function TradingProfitCalculator() {
  const [openPrice, setOpenPrice] = useState("4046.98");
  const [targetPrice, setTargetPrice] = useState("4070");
  const [qtyLots, setQtyLots] = useState("0.01");

  const FIXED_POINT_VALUE = 100; // $100 per point per 1 lot

  const toNum = (v) => {
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const open = toNum(openPrice);
  const target = toNum(targetPrice);
  const qty = toNum(qtyLots);

  const move = target - open;
  const absMove = Math.abs(move);
  const profit = move * FIXED_POINT_VALUE * qty;

  const formatted = (n, dp = 2) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: dp,
          maximumFractionDigits: dp,
        })
      : "—";

  return (
    <div className="">
      <h2 className="text-xl font-semibold mb-4">Trading P/L Calculator</h2>

      <div className="grid grid-cols-1 gap-4">
        <Input label="Open Price" value={openPrice} onChange={setOpenPrice} />
        <Input label="Target / Close Price" value={targetPrice} onChange={setTargetPrice} />
        <Input label="Qty (lots)" value={qtyLots} onChange={setQtyLots} />
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-500">Movement</p>
        <p className={`text-lg font-semibold ${move >= 0 ? "text-green-600" : "text-red-600"}`}>
          {move >= 0 ? "+" : "-"}
          {formatted(absMove)} pts
        </p>

        <hr className="my-4" />

        <p className="text-sm text-gray-500">Estimated Profit / Loss</p>
        <p
          className={`text-2xl font-bold ${profit >= 0 ? "text-green-700" : "text-red-700"}`}
        >
          ${formatted(profit)}
        </p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label>
      <div className="text-sm text-gray-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border p-2"
      />
    </label>
  );
}

/* Tailwind animation helper */
// .animate-scaleIn { animation: scaleIn 0.2s ease; }
// @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; }}