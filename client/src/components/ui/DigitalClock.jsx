import { useEffect, useState } from "react";
import { HiClock } from "react-icons/hi2";

export default function DigitalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time and date
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Dynamic color scheme (Morning / Afternoon / Night)
  const hour = currentTime.getHours();
  let theme = {
    from: "from-emerald-400/20",
    via: "via-green-500/10",
    to: "to-teal-600/20",
    icon: "text-emerald-400",
    shadow: "rgba(34,197,94,0.45)",
  };

  if (hour >= 11 && hour < 17) {
    theme = {
      from: "from-amber-300/20",
      via: "via-orange-400/10",
      to: "to-rose-500/20",
      icon: "text-amber-400",
      shadow: "rgba(245,158,11,0.45)",
    };
  } else if (hour >= 17 || hour < 5) {
    theme = {
      from: "from-sky-400/20",
      via: "via-indigo-400/10",
      to: "to-violet-600/20",
      icon: "text-sky-400",
      shadow: "rgba(56,189,248,0.35)",
    };
  }

  return (
    <div
      className="
        fixed top-6 right-6 z-50
        flex flex-col items-center sm:items-end gap-1
        px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700
        bg-white/60 dark:bg-slate-900/50 backdrop-blur-md
        shadow-[0_8px_40px_rgba(0,0,0,0.18)]
        transition-all duration-500 ease-in-out
        min-w-[220px]
        overflow-hidden
      "
    >
      {/* Animated Aurora Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${theme.from} ${theme.via} ${theme.to} blur-3xl opacity-60 animate-gradient-move`}
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* Clock */}
      <div className="relative flex items-center gap-3">
        <HiClock
          className={`w-6 h-6 ${theme.icon} animate-pulse`}
          style={{ filter: `drop-shadow(0 0 8px ${theme.shadow})` }}
        />
        <span className="font-mono text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-widest">
          {formattedTime}
        </span>
      </div>

      {/* Date */}
      <div className="relative">
        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-400 tracking-wide">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
