// TradesList.jsx (Ultra Fast v2.0)
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
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
  FaChevronDown,
} from "react-icons/fa";
import { format } from "date-fns";
import { MdShowChart } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable"; // plugin registers doc.autoTable
import { FixedSizeList as List } from "react-window";

const INSTRUMENTS = ["Gold", "Bitcoin", "Nifty", "BankNifty", "Crude Oil"];

const ROW_HEIGHT = 64; // px for virtualized rows (adjust if you adjust row padding)

const ROW_ANIM = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export default function TradesList() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  // master data + UI state
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filters / sorting
  const [instrument, setInstrument] = useState("all");
  const [result, setResult] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // search + pagination
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState(""); // debounced
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // UI extras
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // virtualization ref
  const listRef = useRef(null);

  // modal-ish / delete
  const [deletingId, setDeletingId] = useState(null);

  // fetch trades
  useEffect(() => {
    let mounted = true;
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
          : payload.data || [];
        if (mounted) setTrades(list);
      } catch (err) {
        console.error("Fetch trades error:", err);
        if (mounted) setError("Failed to load trades");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTrades();
    return () => {
      mounted = false;
    };
  }, []);

  // click outside for export dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExport(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // debounced search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setQuery(rawQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [rawQuery]);

  // memoized filtered + sorted list
  const filtered = useMemo(() => {
    let data = Array.isArray(trades) ? trades.slice() : [];

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
    if (query) {
      const q = query.toLowerCase();
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

    // stable sort
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

  // totals memoized
  const total = filtered.length;
  const totalProfit = useMemo(
    () =>
      trades
        .filter((t) => Number(t.amount) > 0)
        .reduce((a, b) => a + Number(b.amount), 0),
    [trades]
  );
  const totalLoss = useMemo(
    () =>
      trades
        .filter((t) => Number(t.amount) < 0)
        .reduce((a, b) => a + Math.abs(Number(b.amount)), 0),
    [trades]
  );

  // pagination helpers (works with virtualization: we scroll to item)
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  // When page changes, scroll virtualized list to start of page
  useEffect(() => {
    if (listRef.current) {
      const startIndex = (page - 1) * pageSize;
      // clamp
      const idx = Math.min(Math.max(0, startIndex), Math.max(0, total - 1));
      try {
        listRef.current.scrollToItem(idx, "start");
      } catch (e) {
        // ignore if not possible
      }
    }
  }, [page, pageSize, total]);

  // paginated slice for display text (we still render virtualized full filtered list,
  // but we keep paginated numbers and "Showing X - Y of Z")
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // EXPORT helpers (export filtered results and filters metadata)
  const exportData = useMemo(
    () =>
      filtered.map((t) => ({
        Instrument: t.instrument,
        Entry: t.entryPrice,
        Exit: t.exitPrice,
        Quantity: `${t.quantity} ${t.unit}`,
        Result: Number(t.amount) >= 0 ? "Profit" : "Loss",
        Amount: t.amount,
        Date: format(new Date(t.datetime), "dd MMM yyyy, hh:mm a"),
      })),
    [filtered]
  );

  const exportCSV = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Trades_${Date.now()}.csv`);
    setShowExport(false);
  }, [exportData]);

  const exportExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    XLSX.writeFile(wb, `Trades_${Date.now()}.xlsx`);
    setShowExport(false);
  }, [exportData]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Trade Report", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(80);

    const filterLines = [
      `Instrument: ${instrument !== "all" ? instrument : "All"}`,
      `Result: ${result !== "all" ? result : "All"}`,
      `From: ${fromDate || "—"}`,
      `To: ${toDate || "Present"}`,
      `Search: ${query || "All"}`,
      `Sorted by: ${sortKey} ${sortOrder}`,
    ];

    let y = 25;
    filterLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 6;
    });

    // doc.autoTable is available because of import 'jspdf-autotable'
    // head + body
    doc.autoTable({
      startY: y + 4,
      head: [
        ["Instrument", "Entry", "Exit", "Qty", "Result", "Amount", "Date"],
      ],
      body: exportData.map((row) => [
        row.Instrument,
        row.Entry,
        row.Exit,
        row.Quantity,
        row.Result,
        row.Amount,
        row.Date,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 150, 0] },
      theme: "grid",
    });

    doc.save(`Trades_${Date.now()}.pdf`);
    setShowExport(false);
  }, [
    exportData,
    instrument,
    result,
    fromDate,
    toDate,
    query,
    sortKey,
    sortOrder,
  ]);

  // delete
  const deleteTrade = useCallback(
    async (id) => {
      if (!confirm("Delete this trade?")) return;
      try {
        setDeletingId(id);
        await api.delete(`/journals/trade/${id}`);
        setTrades((prev) => prev.filter((t) => (t._id || t.id) !== id));
      } catch (err) {
        console.error("Delete trade error:", err);
        alert(err?.response?.data?.message || "Failed to delete");
      } finally {
        setDeletingId(null);
      }
    },
    [setTrades]
  );

  // toggle sort
  const toggleSort = () => {
    setSortKey((k) => (k === "date" ? "amount" : "date"));
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  // Virtualized row renderer (desktop)
  const Row = useCallback(
    ({ index, style, data }) => {
      // data = filtered array
      const t = data[index];
      if (!t) return null;
      const id = t._id || t.id;
      const isProfit = Number(t.amount) >= 0;

      return (
        <div
          style={style}
          onClick={() =>
            navigate(`/student/trade-entries/${id}`, {
              state: { trade: t },
            })
          }
          className={`flex items-center gap-4 px-4 ${
            index % 2 === 0 ? "bg-white" : "bg-gray-50"
          } hover:bg-green-50 cursor-pointer`}
        >
          {/* status bar */}
          <div
            className="w-1 h-14 rounded-r-md"
            style={{ backgroundColor: isProfit ? "#34d399" : "#fb7185" }}
          />
          <div className="flex-1 py-4 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-2 font-medium text-gray-800">
              {t.instrument}
            </div>
            <div className="col-span-1 text-gray-700">{t.entryPrice}</div>
            <div className="col-span-1 text-gray-700">{t.exitPrice}</div>
            <div className="col-span-1 text-gray-700">
              {t.quantity} {t.unit}
            </div>
            <div className="col-span-2">
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
                <span className="capitalize">
                  {isProfit ? "Profit" : "Loss"}
                </span>
              </span>
            </div>
            <div
              className={`col-span-2 font-bold ${
                isProfit ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {t.amount}
            </div>
            <div className="col-span-2 text-gray-600">
              {format(new Date(t.datetime), "dd MMM yyyy")}
            </div>
            <div className="col-span-1 text-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this trade?")) deleteTrade(id);
                }}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition"
                title="Delete"
              >
                <FaTrash className="text-base" />
              </button>
            </div>
          </div>
        </div>
      );
    },
    [navigate, deleteTrade]
  );

  // render
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto mt-4">
        {/* Header */}
        <div className="relative mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200">
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/student/journal")}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md transition"
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

          {/* Stats bar */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <MdShowChart className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Total Trades
                </p>
                <p className="text-xl font-semibold text-gray-800">
                  {trades.length}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Net P/L
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FaArrowUp className="text-emerald-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Profit
                    </p>
                    <p className="text-xl font-semibold text-emerald-600">
                      {totalProfit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <FaArrowDown className="text-red-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Loss
                    </p>
                    <p className="text-xl font-semibold text-red-600">
                      {totalLoss.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl shadow border flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <FaArrowUp className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Win Rate
                </p>
                <p className="text-xl font-semibold text-gray-800">
                  {(() => {
                    const wins = trades.filter(
                      (t) => Number(t.amount) > 0
                    ).length;
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

          <div className="md:col-span-2 flex items-end">
            <div className="relative w-full">
              <label className="sr-only">Search trades</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaSearch />
              </div>
              <input
                placeholder="Search instrument, notes, price..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Controls + Export */}
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

          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExport((p) => !p)}
              className="px-3 py-2 bg-white border rounded-lg shadow-sm text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              Export Trade Data <FaChevronDown className="text-xs" />
            </button>

            {showExport && (
              <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-lg overflow-hidden z-20">
                <button
                  onClick={exportCSV}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  CSV
                </button>
                <button
                  onClick={exportExcel}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  Excel
                </button>
                <button
                  onClick={exportPDF}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  PDF
                </button>
              </div>
            )}
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

        {/* Desktop virtualized table + Mobile cards */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop: virtualized list */}
            <div className="hidden md:block rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              {/* Header row (static) */}
              <div className="grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 items-center">
                <div className="col-span-1" /> {/* status col placeholder */}
                <div className="col-span-2">Instrument</div>
                <div className="col-span-1">Entry</div>
                <div className="col-span-1">Exit</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-2">Result</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              {/* Virtualized list (renders filtered data but pagination still controls scroll) */}
              <List
                height={Math.min(ROW_HEIGHT * 10, ROW_HEIGHT * filtered.length)} // visible height (10 rows or less)
                itemCount={filtered.length}
                itemSize={ROW_HEIGHT}
                width={"100%"}
                itemData={filtered}
                ref={listRef}
              >
                {Row}
              </List>
            </div>

            {/* Mobile Cards (kept unchanged but optimized) */}
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
                            <span className="capitalize">
                              {isProfit ? "Profit" : "Loss"}
                            </span>
                          </span>

                          <button
                            onClick={() =>
                              navigate(`/student/trade-entries/${id}`, {
                                state: { trade: t },
                              })
                            }
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

        {/* Pagination controls (works with virtualized list by scrolling) */}
        {!loading && !error && filtered.length > 0 && (
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {Math.min((page - 1) * pageSize + 1, total)}
              </span>{" "}
              -{" "}
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
                {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                  // page window centered
                  const half = Math.floor(7 / 2);
                  const start = Math.max(
                    1,
                    Math.min(totalPages - 6, page - half)
                  );
                  const pNum = start + i;
                  if (pNum > totalPages) return null;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`px-3 py-1 rounded ${
                        pNum === page
                          ? "bg-green-600 text-white"
                          : "border bg-white"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
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
      </div>
    </div>
  );
}
