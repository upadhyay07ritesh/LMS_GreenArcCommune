import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaChartLine,
  FaFilter,
  FaArrowDown,
  FaArrowUp,
  FaTimes,
} from "react-icons/fa";
import { format } from "date-fns";

const INSTRUMENTS = [
  "Gold",
  "Bitcoin",
  "Ethereum",
  "Nifty",
  "BankNifty",
  "Crude Oil",
];

const TradesList = () => {
  const { user } = useSelector((s) => s.auth);

  const [trades, setTrades] = useState([]); // master list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters / sorting
  const [instrument, setInstrument] = useState("all");
  const [result, setResult] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState("date"); // 'date' | 'amount'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'

  // modal
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/journals/trade/my-trades");
      // backend might return { trades: [...] } or [...] directly
      const payload = res.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.trades)
        ? payload.trades
        : payload.data || []; // fallback
      setTrades(list);
    } catch (err) {
      console.error("Fetch trades error:", err);
      setError("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  // derived filtered & sorted list (memoized)
  const filtered = useMemo(() => {
    let data = Array.isArray(trades) ? [...trades] : [];

    if (instrument !== "all") {
      data = data.filter((t) => t.instrument === instrument);
    }

    if (result !== "all") {
      data = data.filter((t) => t.result === result);
    }

    if (fromDate) {
      const from = new Date(fromDate);
      data = data.filter((t) => new Date(t.datetime) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      // include full day for toDate
      to.setHours(23, 59, 59, 999);
      data = data.filter((t) => new Date(t.datetime) <= to);
    }

    data.sort((a, b) => {
      if (sortKey === "date") {
        const ad = new Date(a.datetime).getTime();
        const bd = new Date(b.datetime).getTime();
        return sortOrder === "asc" ? ad - bd : bd - ad;
      }

      if (sortKey === "amount") {
        const aa = Number(a.amount || 0);
        const ba = Number(b.amount || 0);
        return sortOrder === "asc" ? aa - ba : ba - aa;
      }

      return 0;
    });

    return data;
  }, [trades, instrument, result, fromDate, toDate, sortKey, sortOrder]);

  const toggleSort = () => {
    setSortKey((k) => (k === "date" ? "amount" : "date"));
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const openModal = (trade) => {
    setSelectedTrade(trade);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTrade(null);
  };

  const deleteTrade = async (id) => {
    if (!confirm("Delete this trade?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/journals/trade/${id}`);
      setTrades((prev) => prev.filter((t) => (t._id || t.id) !== id));
      // if modal open showing deleted trade, close it
      if (selectedTrade && (selectedTrade._id || selectedTrade.id) === id) {
        closeModal();
      }
    } catch (err) {
      console.error("Delete trade error:", err);
      alert(err?.response?.data?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FaChartLine className="text-green-700 text-3xl" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Trades</h1>
            <p className="text-sm text-gray-500">
              {user?.name ? `Welcome, ${user.name}` : "Your recent trades"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold">Instrument</label>
            <select
              className="w-full p-2 border rounded-lg mt-1"
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
            >
              <option value="all">All</option>
              {INSTRUMENTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold">Result</label>
            <select
              className="w-full p-2 border rounded-lg mt-1"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            >
              <option value="all">All</option>
              <option value="profit">Profit</option>
              <option value="loss">Loss</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold">From Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg mt-1"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold">To Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded-lg mt-1"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex justify-between items-center mb-4">
          <div />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSort}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white shadow-sm"
            >
              <FaFilter />
              <span className="text-sm">
                Sort by {sortKey === "date" ? "Date" : "Amount"}
              </span>
              {sortOrder === "asc" ? (
                <FaArrowUp className="text-xs" />
              ) : (
                <FaArrowDown className="text-xs" />
              )}
            </button>
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="text-center py-12 text-gray-500">Loading trades...</div>
        )}
        {!loading && error && (
          <div className="text-center py-12 text-red-600">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">No trades found.</div>
        )}

        {/* Desktop Table */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Instrument</th>
                    <th className="p-3 text-left">Entry</th>
                    <th className="p-3 text-left">Exit</th>
                    <th className="p-3 text-left">Qty</th>
                    <th className="p-3 text-left">Result</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => {
                    const id = t._id || t.id;
                    return (
                      <tr
                        key={id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => openModal(t)}
                      >
                        <td className="p-3">{t.instrument}</td>
                        <td className="p-3">{t.entryPrice}</td>
                        <td className="p-3">{t.exitPrice}</td>
                        <td className="p-3">{t.quantity} {t.unit}</td>
                        <td className="p-3 capitalize">{t.result}</td>
                        <td className={`p-3 font-semibold ${Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {t.amount}
                        </td>
                        <td className="p-3">{format(new Date(t.datetime), "dd MMM yyyy")}</td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Delete this trade?")) deleteTrade(id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filtered.map((t) => {
                const id = t._id || t.id;
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="p-4 bg-white rounded-xl shadow-sm border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{t.instrument}</h3>
                        <p className="text-xs text-gray-500 mt-1">{format(new Date(t.datetime), "dd MMM yyyy, hh:mm a")}</p>
                      </div>

                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => openModal(t)}
                          className="px-3 py-1 text-sm rounded bg-gray-100"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this trade?")) deleteTrade(id);
                          }}
                          className="text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-700 grid grid-cols-2 gap-2">
                      <div>Entry: <span className="font-medium">{t.entryPrice}</span></div>
                      <div>Exit: <span className="font-medium">{t.exitPrice}</span></div>
                      <div>Qty: <span className="font-medium">{t.quantity} {t.unit}</span></div>
                      <div>Amount: <span className={`font-semibold ${Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-600"}`}>{t.amount}</span></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Modal */}
        <AnimatePresence>
          {modalOpen && selectedTrade && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border p-6 relative"
              >
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>

                <h2 className="text-xl font-bold mb-2">{selectedTrade.instrument}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {format(new Date(selectedTrade.datetime), "dd MMM yyyy, hh:mm a")}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Entry Price</div>
                    <div className="font-medium">{selectedTrade.entryPrice}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Exit Price</div>
                    <div className="font-medium">{selectedTrade.exitPrice}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Quantity</div>
                    <div className="font-medium">{selectedTrade.quantity} {selectedTrade.unit}</div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Result</div>
                    <div className={`font-medium ${selectedTrade.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {selectedTrade.result} — {selectedTrade.amount}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="mt-2 p-3 bg-gray-50 rounded">{selectedTrade.description || "No notes"}</div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      const id = selectedTrade._id || selectedTrade.id;
                      if (!confirm("Delete this trade?")) return;
                      deleteTrade(id);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white"
                    disabled={deletingId === (selectedTrade._id || selectedTrade.id)}
                  >
                    {deletingId === (selectedTrade._id || selectedTrade.id) ? "Deleting..." : "Delete"}
                  </button>

                  <button onClick={closeModal} className="px-4 py-2 rounded-lg border">
                    Close
                  </button>
                </div>
              </motion.div>

              {/* backdrop */}
              <motion.div
                onClick={closeModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradesList;
