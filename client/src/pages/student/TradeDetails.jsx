import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import {
  FaArrowLeft,
  FaArrowUp,
  FaArrowDown,
  FaSearchPlus,
} from "react-icons/fa";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const TradeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const cachedTrade = state?.trade || null;

  const [trade, setTrade] = useState(cachedTrade);
  const [loading, setLoading] = useState(!cachedTrade);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [ratio, setRatio] = useState(null);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (cachedTrade) return;

    const fetchTrade = async () => {
      try {
        const res = await api.get(`/journals/trade/${id}`);
        setTrade(res.data.trade || res.data);
      } catch (err) {
        console.error("Trade fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrade();
  }, [id, cachedTrade]);

  const buildImageURL = (path) => {
    if (!path) return null;

    const clean = path.replace(/\\/g, "/");

    if (clean.startsWith("http")) return clean;

    const finalPath = clean.startsWith("/") ? clean : `/${clean}`;

    if (finalPath.startsWith("/uploads")) {
      const base = import.meta.env.VITE_API_URL.replace("/api", "");
      return `${base}${finalPath}`;
    }

    return `${import.meta.env.VITE_API_URL}${finalPath}`;
  };

  const screenshotUrl = buildImageURL(trade.screenshot);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500 text-lg">
        Loading trade details...
      </div>
    );

  if (!trade)
    return (
      <div className="p-6 text-center text-red-500 text-lg">
        Trade not found.
      </div>
    );

  console.log("TRADE DATA => ", trade);
  console.log("SCREENSHOT => ", trade?.screenshot);
  console.log("Screenshot URL =>", screenshotUrl);

  const isProfit = Number(trade.amount) >= 0;

  const points = Math.abs(trade.exitPrice - trade.entryPrice);
  const reward = Math.abs(trade.amount);
  const risk = reward / 2;
  const rr = (reward / risk).toFixed(2);

  /* --------------------------------------
    ⭐ AUTO-RESIZED IMAGE (ULTRA PRO MAX)
  -------------------------------------- */
 const AutoResizedImage = ({ src, onZoom }) => {
  const containerRef = React.useRef(null);

  const onImageLoad = (e) => {
    const img = e.target;
    const container = containerRef.current;

    if (!img || !container) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    const containerW = container.clientWidth;

    const newHeight = (naturalH / naturalW) * containerW;

    container.style.height = `${newHeight}px`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden transition-all duration-300"
    >
      <img
        src={src}
        onLoad={onImageLoad}
        className="absolute inset-0 w-full h-full object-contain rounded-2xl"
      />

      <button
        onClick={onZoom}
        className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-lg shadow hover:scale-105 transition"
      >
        <FaSearchPlus className="text-gray-700" />
      </button>
    </div>
  );
};


  /* --------------------------------------
    ⭐ ZOOM VIEWER (PRO MAX)
  -------------------------------------- */
  const ZoomImage = ({ src, onClose }) => {
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const drag = React.useRef(false);
    const start = React.useRef({ x: 0, y: 0 });

    const onWheel = (e) => {
      e.preventDefault();
      setScale((s) => Math.min(6, Math.max(1, s - e.deltaY * 0.002)));
    };

    const mouseDown = (e) => {
      drag.current = true;
      start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    };

    const mouseMove = (e) => {
      if (!drag.current) return;
      setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
    };

    const mouseUp = () => (drag.current = false);

    const doubleTap = () => {
      setScale((prev) => (prev === 1 ? 2.5 : 1));
      setPos({ x: 0, y: 0 });
    };

    return (
      <div
        className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl cursor-move bg-black"
        onWheel={onWheel}
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}
        onMouseLeave={mouseUp}
        onDoubleClick={doubleTap}
      >
        <img
          src={src}
          draggable={false}
          className="select-none"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: drag.current ? "none" : "transform 0.2s ease",
          }}
        />

        <button
          className="absolute top-4 right-4 bg-white/80 px-3 py-1 rounded-lg shadow hover:bg-white"
          onClick={onClose}
        >
          Close
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
          <button
            onClick={() => setScale((s) => Math.min(6, s + 0.3))}
            className="px-4 py-2 bg-white/80 rounded-lg shadow"
          >
            +
          </button>

          <button
            onClick={() => setScale((s) => Math.max(1, s - 0.3))}
            className="px-4 py-2 bg-white/80 rounded-lg shadow"
          >
            -
          </button>
        </div>
      </div>
    );
  };

  /* --------------------------------------
        RENDER UI
  -------------------------------------- */

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-gray-50 to-gray-100"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black mb-6"
        >
          <FaArrowLeft />
          Back
        </button>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT SCREENSHOT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {screenshotUrl ? (
              <AutoResizedImage
                src={screenshotUrl}
                onZoom={() => setZoomOpen(true)}
              />
            ) : (
              <p className="text-gray-300 p-10">No Screenshot Added</p>
            )}
          </motion.div>

          {/* RIGHT TRADE INFO CARD */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 border"
          >
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">{trade.instrument}</h1>

              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold ${
                  isProfit
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isProfit ? <FaArrowUp /> : <FaArrowDown />}
                {isProfit ? "Profit" : "Loss"}
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(trade.datetime), "dd MMM yyyy, hh:mm a")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              <div>
                <p className="text-xs text-gray-500">Entry Price</p>
                <p className="text-lg font-semibold">{trade.entryPrice}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Exit Price</p>
                <p className="text-lg font-semibold">{trade.exitPrice}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="text-lg font-semibold">
                  {trade.quantity} {trade.unit}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p
                  className={`text-lg font-semibold ${
                    isProfit ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {trade.amount}
                </p>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 p-5 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Premium Analytics
              </h3>

              <div className="grid grid-cols-2 gap-4 text-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Points Move</p>
                  <p className="font-semibold">{points}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Reward</p>
                  <p className="font-semibold">{reward}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Risk (est.)</p>
                  <p className="font-semibold">{risk}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">RR Ratio</p>
                  <p className="font-semibold">{rr}:1</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs text-gray-500 mb-2">Description</p>
              <div className="p-4 bg-gray-50 rounded-xl">
                {trade.description || "No additional notes"}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* FULLSCREEN ZOOM */}
      <AnimatePresence>
        {zoomOpen && screenshotUrl && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomOpen(false)}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <ZoomImage
                src={screenshotUrl}
                onClose={() => setZoomOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TradeDetails;
