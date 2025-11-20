import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaChartLine,
  FaFilter,
  FaArrowDown,
  FaArrowUp,
  FaTimes,
  FaPlus,
  FaSearch,
} from "react-icons/fa";
import { format } from "date-fns";
import { MdShowChart } from "react-icons/md";


const INSTRUMENTS = [
  "Gold",
  "Bitcoin",
  "Ethereum",
  "Nifty",
  "BankNifty",
  "Crude Oil",
];

const ROW_ANIM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const TradesList = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
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

  // search + pagination
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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
      to.setHours(23, 59, 59, 999);
      data = data.filter((t) => new Date(t.datetime) <= to);
    }

    // search query applied here (matches instrument, description, entryPrice, exitPrice)
    if (query && query.trim() !== "") {
      const q = query.trim().toLowerCase();
      data = data.filter((t) => {
        const desc = (t.description || "").toLowerCase();
        const inst = (t.instrument || "").toLowerCase();
        const entry = String(t.entryPrice || "").toLowerCase();
        const exit = String(t.exitPrice || "").toLowerCase();
        return (
          inst.includes(q) ||
          desc.includes(q) ||
          entry.includes(q) ||
          exit.includes(q)
        );
      });
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
  }, [trades, instrument, result, fromDate, toDate, sortKey, sortOrder, query]);

  const toggleSort = () => {
    setSortKey((k) => (k === "date" ? "amount" : "date"));
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  // pagination slice
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

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

  // helper: page numbers window (max 7)
  const pageWindow = () => {
    const maxButtons = 7;
    const pages = [];
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto mt-4">
        {/* Header */}
<div className="relative mb-8">
  <div
    className="
      flex flex-col md:flex-row md:items-center md:justify-between 
      gap-6 p-6 
      bg-white/70 backdrop-blur-xl 
      rounded-2xl shadow-lg border border-gray-200
    "
  >
    {/* Left Section — Icon + Title */}
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-green-100 shadow-inner">
        <MdShowChart className="text-green-600 text-3xl" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          My Trades
        </h1>
        <p className="text-sm text-gray-500">
          {user?.name ? `Welcome, ${user.name}` : "Your recent trades"}
        </p>
      </div>
    </div>

    {/* Right Buttons */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate("/student/journal")}
        className="hidden sm:flex items-center gap-2 px-5 py-2.5 
                   bg-green-600 hover:bg-green-700 text-white 
                   rounded-xl shadow-md transition"
      >
        <FaPlus className="text-sm" />
        Add Trade
      </button>

      <button
        onClick={() => navigate("/student/journal")}
        className="sm:hidden p-3 bg-green-600 text-white rounded-full shadow-md"
      >
        <FaPlus />
      </button>
    </div>
  </div>

  {/* Stats Bar */}
  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
    
    {/* Total Trades */}
    <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
        <MdShowChart className="text-blue-600 text-xl" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">Total Trades</p>
        <p className="text-xl font-semibold text-gray-800">{trades.length}</p>
      </div>
    </div>

    {/* P/L */}
    <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
        <FaArrowUp className="text-emerald-600 text-xl" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">Net P/L</p>
        <p className={`text-xl font-semibold ${trades.reduce((a, b) => a + (Number(b.amount) || 0), 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {Number(
  trades.reduce((a, b) => a + (Number(b.amount) || 0), 0)
).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

        </p>
      </div>
    </div>

    {/* Win Rate */}
    <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
        <FaArrowUp className="text-purple-600 text-xl" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">Win Rate</p>
        <p className="text-xl font-semibold text-gray-800">
          {(() => {
            const wins = trades.filter((t) => Number(t.amount) > 0).length;
            return trades.length === 0
              ? "0%"
              : `${Math.round((wins / trades.length) * 100)}%`;
          })()}
        </p>
      </div>
    </div>

  </div>
</div>


        {/* Filters + Search */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-md border border-gray-200 grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Instrument
            </label>
            <select
              className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm mt-1"
              value={instrument}
              onChange={(e) => {
                setInstrument(e.target.value);
                setPage(1);
              }}
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
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Result
            </label>
            <select
              className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm mt-1"
              value={result}
              onChange={(e) => {
                setResult(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="profit">Profit</option>
              <option value="loss">Loss</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              From
            </label>
            <input
              type="date"
              className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm mt-1"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              To
            </label>
            <input
              type="date"
              className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm mt-1"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Search */}
          <div className="md:col-span-2 flex items-end">
            <div className="relative w-full">
              <label className="sr-only">Search trades</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaSearch />
              </div>
              <input
                placeholder="Search instrument, notes, price..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Controls: Sort + PageSize */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSort}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm text-sm hover:bg-gray-50"
              title="Toggle sort key & order"
            >
              <FaFilter />
              <span>
                Sort by {sortKey === "date" ? "Date" : "Amount"} (
                {sortOrder === "asc" ? "Asc" : "Desc"})
              </span>
            </button>
            <div className="text-sm text-gray-600">Total: {total}</div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Rows</label>
            <select
              className="p-2 border rounded-lg bg-white text-sm"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Loading / Error / Empty */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            Loading trades...
          </div>
        )}
        {!loading && error && (
          <div className="text-center py-12 text-red-600">{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-lg font-medium">
            No trades found.
          </div>
        )}

        {/* Desktop – Premium Card-Based Admin Table with animated rows */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="hidden md:block rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-sm relative">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="py-3 px-0 w-2" /> {/* status bar col */}
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Instrument
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Entry
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Exit
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Result
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="py-3 px-4 text-center font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <AnimatePresence initial={false}>
                    {paginated.map((t, idx) => {
                      const id = t._id || t.id;
                      const isProfit = Number(t.amount) >= 0;
                      return (
                        <motion.tr
                          key={id}
                          {...ROW_ANIM}
                          layout
                          onClick={() => openModal(t)}
                          className={`transition cursor-pointer ${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-green-50`}
                        >
                          {/* status colored bar */}
                          <td className="py-3 px-0 align-middle">
                            <div
                              className={`h-10 w-1 rounded-r-md ${
                                isProfit ? "bg-emerald-400" : "bg-red-400"
                              }`}
                            />
                          </td>

                          <td className="py-3 px-4 font-medium text-gray-800">
                            {t.instrument}
                          </td>

                          <td className="py-3 px-4 text-gray-700">
                            {t.entryPrice}
                          </td>

                          <td className="py-3 px-4 text-gray-700">
                            {t.exitPrice}
                          </td>

                          <td className="py-3 px-4 text-gray-700">
                            {t.quantity} {t.unit}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-2 px-2 py-1 text-xs font-semibold rounded-lg ${
                                isProfit
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isProfit ? (
                                <FaArrowUp className="text-xs" />
                              ) : (
                                <FaArrowDown className="text-xs" />
                              )}
                              <span className="capitalize">{t.result}</span>
                            </span>
                          </td>

                          <td
                            className={`py-3 px-4 font-bold ${
                              isProfit ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {t.amount}
                          </td>

                          <td className="py-3 px-4 text-gray-600">
                            {format(new Date(t.datetime), "dd MMM yyyy")}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this trade?"))
                                  deleteTrade(id);
                              }}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition"
                              title="Delete"
                            >
                              <FaTrash className="text-base" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              <AnimatePresence>
                {paginated.map((t) => {
                  const id = t._id || t.id;
                  const isProfit = Number(t.amount) >= 0;
                  return (
                    <motion.div
                      key={id}
                      {...ROW_ANIM}
                      layout
                      className="relative p-4 bg-white rounded-2xl shadow-md border overflow-hidden"
                    >
                      <div
                        className={`absolute left-0 top-4 bottom-4 w-1 ${
                          isProfit ? "bg-emerald-400" : "bg-red-400"
                        } rounded-r-md`}
                      />
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {t.instrument}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(t.datetime),
                              "dd MMM yyyy, hh:mm a"
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${
                              isProfit
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isProfit ? (
                              <FaArrowUp className="text-xs" />
                            ) : (
                              <FaArrowDown className="text-xs" />
                            )}
                            <span className="capitalize">{t.result}</span>
                          </span>

                          <button
                            onClick={() => openModal(t)}
                            className="px-3 py-1 rounded-lg bg-gray-100 text-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
                        <div>
                          Entry:{" "}
                          <span className="font-medium">{t.entryPrice}</span>
                        </div>
                        <div>
                          Exit:{" "}
                          <span className="font-medium">{t.exitPrice}</span>
                        </div>
                        <div>
                          Qty:{" "}
                          <span className="font-medium">
                            {t.quantity} {t.unit}
                          </span>
                        </div>
                        <div>
                          Amount:{" "}
                          <span
                            className={`font-semibold ${
                              isProfit ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {t.amount}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Pagination controls */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
              <span className="font-medium">
                {Math.min(page * pageSize, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {pageWindow().map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded ${
                      p === page ? "bg-green-600 text-white" : "border bg-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal (Improved Premium UI) */}
        <AnimatePresence>
          {modalOpen && selectedTrade && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border p-6 relative"
              >
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>

                <h2 className="text-2xl font-bold mb-1">
                  {selectedTrade.instrument}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  {format(
                    new Date(selectedTrade.datetime),
                    "dd MMM yyyy, hh:mm a"
                  )}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Entry Price</p>
                    <p className="font-medium">{selectedTrade.entryPrice}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Exit Price</p>
                    <p className="font-medium">{selectedTrade.exitPrice}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-medium">
                      {selectedTrade.quantity} {selectedTrade.unit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Result</p>
                    <p
                      className={`font-medium ${
                        selectedTrade.amount >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedTrade.result} — {selectedTrade.amount}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-500">Description</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                    {selectedTrade.description || "No notes"}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      const id = selectedTrade._id || selectedTrade.id;
                      if (confirm("Delete this trade?")) deleteTrade(id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                  >
                    {deletingId === (selectedTrade._id || selectedTrade.id)
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border rounded-xl hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </motion.div>

              {/* Backdrop */}
              <motion.div
                onClick={closeModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradesList;
