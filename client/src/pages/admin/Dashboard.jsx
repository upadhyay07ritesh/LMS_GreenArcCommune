import { useEffect, useState, useMemo } from "react";
import api from "../../api/axios.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiUsers,
  HiBookOpen,
  HiCheckCircle,
  HiChartBar,
  HiArrowTrendingUp,
  HiSun,
  HiCloud,
  HiMoon,
} from "react-icons/hi2";
import DigitalClock from "../../components/ui/DigitalClock.jsx";
import ProTradingLoader from "../../components/ui/ProTradingLoader.jsx";

function getGreeting(date, name = "Admin") {
  const hour = date.getHours();
  let icon, title, quote, gradient;

  if (hour >= 5 && hour < 12) {
    title = `Good Morning, ${name} ☀️`;
    quote = "Start your day with purpose — every decision shapes success!";
    icon = <HiSun className="w-8 h-8 text-yellow-500" />;
    gradient = "from-yellow-400 to-orange-500";
  } else if (hour >= 12 && hour < 18) {
    title = `Good Afternoon, ${name} 🌤️`;
    quote = "Keep pushing forward — progress is built one great decision at a time!";
    icon = <HiCloud className="w-8 h-8 text-sky-400" />;
    gradient = "from-sky-400 to-indigo-500";
  } else {
    title = `Good Evening, ${name} 🌙`;
    quote = "Reflect, recharge, and get ready to lead even stronger tomorrow!";
    icon = <HiMoon className="w-8 h-8 text-indigo-400" />;
    gradient = "from-indigo-500 to-purple-600";
  }

  return { title, quote, icon, gradient };
}


/* ================== Main Component ================== */
export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState(
    localStorage.getItem("adminName") || "Admin"
  );
  const [greeting, setGreeting] = useState(() =>
    getGreeting(new Date(), adminName)
  );

  
  /* --- 1️⃣ Load Admin Profile --- */
  useEffect(() => {
    let mounted = true;

    const fetchAdmin = async () => {
      try {
        const res = await api.get("/admin/profile");
        if (mounted && res.data?.admin?.name) {
          const name = res.data.admin.name;
          setAdminName(name);
          localStorage.setItem("adminName", name);
          setGreeting(getGreeting(new Date(), name));
        }
      } catch (err) {
        console.warn("Could not load admin profile:", err.message);
      }
    };

    fetchAdmin();
    return () => {
      mounted = false;
    };
  }, []);

  /* --- 2️⃣ Load Stats --- */
  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const res = await api.get("/admin/analytics");
        if (mounted) setStats(res.data?.data || res.data || {});
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadStats();
    const refresh = setInterval(loadStats, 10000);
    return () => {
      mounted = false;
      clearInterval(refresh);
    };
  }, []);

  /* --- 3️⃣ Live Greeting Updater --- */
  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getGreeting(new Date(), adminName));
    }, 60000);
    return () => clearInterval(timer);
  }, [adminName]);

  /* --- 4️⃣ Memoized Cards --- */
  const statCards = useMemo(
    () => [
      {
        label: "Total Students",
        value: stats?.totalStudents ?? 0,
        icon: HiUsers,
        bg: "bg-blue-50 dark:bg-blue-950/30",
        text: "text-blue-600 dark:text-blue-400",
        change: "+12%",
      },
      {
        label: "Total Courses",
        value: stats?.totalCourses ?? 0,
        icon: HiBookOpen,
        bg: "bg-indigo-50 dark:bg-indigo-950/30",
        text: "text-indigo-600 dark:text-indigo-400",
        change: "+8%",
      },
      {
        label: "Active Courses",
        value: stats?.activeCourses ?? 0,
        icon: HiCheckCircle,
        bg: "bg-green-50 dark:bg-green-950/30",
        text: "text-green-600 dark:text-green-400",
        change: "+5%",
      },
      {
        label: "Total Enrollments",
        value: stats?.totalEnrollments ?? 0,
        icon: HiChartBar,
        bg: "bg-purple-50 dark:bg-purple-950/30",
        text: "text-purple-600 dark:text-purple-400",
        change: "+18%",
      },
    ],
    [stats]
  );

  /* --- 5️⃣ Loader --- */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-slate-900">
        <ProTradingLoader showBrand />
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in">
    {/* Header Greeting */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-md transition-all duration-300">
        <div className="flex items-center gap-4">
          <motion.div
            key={greeting.title}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`p-3 rounded-full bg-gradient-to-br ${greeting.gradient} shadow-lg`}
          >
            {greeting.icon}
          </motion.div>
          <div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={greeting.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-bold text-slate-900 dark:text-white"
              >
                {greeting.title}
              </motion.h1>
            </AnimatePresence>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {greeting.quote}
            </p>
          </div>
        </div>
        <DigitalClock />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div
                className={`${card.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className={`w-7 h-7 ${card.text}`} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <div className="flex justify-between items-end mt-1">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {card.value?.toLocaleString?.() ?? 0}
                </p>
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">
                  <HiArrowTrendingUp className="w-3 h-3" />
                  {card.change}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Platform Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6"
      >
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Platform Status
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time platform metrics
          </p>
        </div>

        <ProgressBar
          label="Active Students"
          value={stats?.activeStudents ?? 0}
          total={stats?.totalStudents ?? 1}
          color="blue"
        />
        <ProgressBar
          label="Published Courses"
          value={stats?.activeCourses ?? 0}
          total={stats?.totalCourses ?? 1}
          color="indigo"
        />
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              System Health
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                Operational
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   ♻️ Reusable ProgressBar Component
============================================================ */
function ProgressBar({ label, value, total, color = "blue" }) {
  const percent = Math.min(100, Math.round((value / total) * 100));

  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  };

  const gradient = colorMap[color] || colorMap.blue;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {value} / {total}
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        {percent}% completed
      </p>
    </div>
  );
}
