import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HiArrowTrendingUp } from "react-icons/hi2";

export default function ProTradingLoader({
  size = 160,
  color = "#16a34a",
  bgColor = "rgba(22,163,74,0.15)",
  duration = 2,
  showBrand = true,
}) {
  const [profit, setProfit] = useState(0);

  // Simulate profit counter
  useEffect(() => {
    const interval = setInterval(() => {
      setProfit((p) => (p < 100 ? p + Math.floor(Math.random() * 4 + 1) : 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden">
      {/* ✨ Background glow animation */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${bgColor}, transparent 70%)`,
        }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 📈 Line chart animation */}
      <div className="relative w-[300px] h-[120px] mb-8">
        <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
          <motion.path
            d="M0 100 Q 50 70, 100 80 T 200 40 T 300 60"
            fill="none"
            stroke={bgColor}
            strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: duration * 1.3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          />
          <motion.path
            d="M0 100 Q 50 70, 100 80 T 200 40 T 300 60"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          />
        </svg>

        {/* 🟢 Floating arrow */}
        <motion.div
          className="absolute bottom-4 right-2"
          animate={{ y: [-8, 0, -8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="p-3 rounded-full shadow-lg"
            style={{ backgroundColor: bgColor, border: `2px solid ${color}` }}
          >
            <HiArrowTrendingUp
              size={30}
              className="drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]"
              style={{ color }}
            />
          </div>
        </motion.div>
      </div>

      {/* 💹 Rotating progress ring */}
      <motion.div
        className="relative mb-6"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `5px solid ${bgColor}`,
          borderTopColor: color,
        }}
      />

      {/* 📊 Profit Counter */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        <h2
          className="text-4xl font-extrabold tracking-tight"
          style={{
            color,
            textShadow: `0 0 16px ${color}`,
          }}
        >
          +{profit}%
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm tracking-wide">
          Analyzing LMS Data...
        </p>
      </motion.div>

      {/* 🌿 Optional Brand / Logo */}
      {showBrand && (
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <img
            src="/GreenArcLogo.png"
            alt="GreenArc Commune"
            className="mx-auto mb-3 w-20 h-20 rounded-full shadow-md object-contain"
          />
          <h3 className="text-slate-700 dark:text-slate-300 text-sm font-medium">
            GreenArc LMS — Empowering Learning
          </h3>
        </motion.div>
      )}
    </div>
  );
}
