import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { myEnrollments, fetchCourses } from "../../slices/courseSlice.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios.js";
import {
  HiBookOpen,
  HiAcademicCap,
  HiCheckCircle,
  HiArrowRight,
  HiChartBar,
  HiSparkles,
  HiClock,
  HiTrophy,
  HiSun,
  HiMoon,
  HiXMark,
} from "react-icons/hi2";

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { enrollments, items } = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [greeting, setGreeting] = useState("Hello");
  const [icon, setIcon] = useState(
    <HiSparkles className="w-5 h-5 text-yellow-300" />
  );
  const [showBanner, setShowBanner] = useState(false);

  // =======================================================
  // INIT: Fetch everything
  // =======================================================
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const { data } = await api.get("/student/profile");
        setProfile(data);
        dispatch(myEnrollments());
        dispatch(fetchCourses());
        const sessionRes = await api.get("/student/live-sessions");
        setLiveSessions(sessionRes.data || []);
      } catch (err) {
        console.warn("⚠️ Dashboard init failed:", err.message);
      }
    };
    initDashboard();
  }, [dispatch]);

  // =======================================================
  // GREETING MESSAGE
  // =======================================================
  // 🕐 Function to get current greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12)
      return {
        text: "Good Morning",
        icon: <HiSun className="w-5 h-5 text-yellow-300" />,
      };
    else if (hour < 18)
      return {
        text: "Good Afternoon",
        icon: <HiSparkles className="w-5 h-5 text-pink-300" />,
      };
    else
      return {
        text: "Good Evening",
        icon: <HiMoon className="w-5 h-5 text-blue-200" />,
      };
  };

  // ⏱️ Update every minute (live greeting)
  useEffect(() => {
    const updateGreeting = () => {
      const { text, icon } = getGreeting();
      setGreeting(text);
      setIcon(icon);
    };

    updateGreeting(); // initial call
    const interval = setInterval(updateGreeting, 60000); // update every 1 min

    return () => clearInterval(interval);
  }, []);

  // =======================================================
  // WELCOME BANNER VISIBILITY (Exactly once after login)
  // =======================================================
  useEffect(() => {
    const BANNER_VISIBLE_MS = 10 * 60 * 1000; // 10 minutes
    const SHOW_ONCE_KEY = 'showWelcomeBannerOnce';
    const SESSION_FLAG = 'welcomeBannerShownThisSession';

    // If login set the SHOW_ONCE_KEY, show now and then clear it
    const shouldShowOnce = sessionStorage.getItem(SHOW_ONCE_KEY) === '1';
    // Or if URL contains wb=1 (fallback trigger via navigation)
    const params = new URLSearchParams(location.search || '');
    const hasWbParam = params.get('wb') === '1';
    if (shouldShowOnce || hasWbParam) {
      sessionStorage.removeItem(SHOW_ONCE_KEY);
      setShowBanner(true);
      sessionStorage.setItem(SESSION_FLAG, '1');
      const timerId = setTimeout(() => setShowBanner(false), BANNER_VISIBLE_MS);
      return () => clearTimeout(timerId);
    }

    // If banner already shown this session, keep it hidden on refresh
    const alreadyShown = sessionStorage.getItem(SESSION_FLAG) === '1';
    if (alreadyShown) {
      setShowBanner(false);
      return;
    }

    // Default: do not auto-show unless coming from a fresh login
    setShowBanner(false);
  }, []);

  const dismissBanner = () => {
    // Hide for the current view; will show again on next login/page load
    setShowBanner(false);
  };

  // =======================================================
  // STATS
  // =======================================================
  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.progress === 100).length;
  const inProgressCourses = enrollments.filter(
    (e) => e.progress > 0 && e.progress < 100
  ).length;
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.progress, 0) /
            enrollments.length
        )
      : 0;

  const stats = [
    {
      label: "Total Enrollments",
      value: totalEnrollments,
      icon: HiBookOpen,
      lightBg: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "In Progress",
      value: inProgressCourses,
      icon: HiChartBar,
      lightBg: "bg-yellow-50 dark:bg-yellow-950/30",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Completed",
      value: completedCourses,
      icon: HiCheckCircle,
      lightBg: "bg-green-50 dark:bg-green-950/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Avg Progress",
      value: `${avgProgress}%`,
      icon: HiAcademicCap,
      lightBg: "bg-primary-50 dark:bg-primary-950/30",
      textColor: "text-primary-600 dark:text-primary-400",
    },
  ];
  // =======================================================
  // MAIN UI
  // =======================================================
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* MAIN CONTENT AREA */}
      <div className="pt-10 w-full max-w-[95vw] sm:max-w-[90vw] mx-auto flex flex-col gap-4 sm:gap-6 overflow-x-hidden">
        {/* 🌈 Welcome Banner */}
        <AnimatePresence>
          {showBanner && (
            <motion.div
              key="welcome-banner"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="
              relative overflow-hidden
              bg-gradient-to-br from-green-600 via-emerald-600 to-green-700
              rounded-2xl shadow-lg text-white
              p-6 sm:p-8 border border-white/10
            "
            >
              {/* Dismiss button */}
              <button
                onClick={dismissBanner}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                aria-label="Dismiss banner"
                title="Dismiss"
              >
                <HiXMark className="w-5 h-5 text-white" />
              </button>

              {/* Decorative background glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none"></div>

              {/* Foreground content */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <span className="text-sm font-medium text-green-50/90">
                      Welcome back!
                    </span>
                  </div>

                  {/* 🔄 Animated Greeting */}
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={greeting}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug mb-1"
                    >
                      {greeting}, {profile?.name || user?.name || "Learner"}! 👋
                    </motion.h2>
                  </AnimatePresence>

                  <p className="text-sm sm:text-base text-green-50/90 max-w-md">
                    Continue your learning journey and achieve your goals today.
                  </p>
                </div>

                {completedCourses > 0 && (
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30 shadow-inner">
                    <HiTrophy className="w-6 h-6 text-yellow-300 drop-shadow" />
                    <div>
                      <p className="text-[11px] text-green-50/80">
                        Courses Completed
                      </p>
                      <p className="text-lg sm:text-2xl font-extrabold text-white">
                        {completedCourses}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📊 Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div
                  className={`${stat.lightBg} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-2`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.textColor}`} />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* 🕒 Upcoming Live Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Upcoming Live Sessions
            </h3>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            {liveSessions.length === 0 ? (
              <p className="text-center text-slate-500 text-sm">
                No upcoming sessions
              </p>
            ) : (
              liveSessions.map((s) => (
                <div
                  key={s._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3 last:border-none"
                >
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                      {s.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {new Date(s.date).toLocaleString()}
                    </p>
                  </div>
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-xs sm:text-sm px-3 py-1.5"
                  >
                    Join Live
                  </a>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* 🎓 Courses Section */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* MY COURSES */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  My Courses
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track your learning progress
                </p>
              </div>
              <Link
                to="/student/courses"
                className="text-sm px-3 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 transition"
              >
                View all
              </Link>
            </div>

            <div className="p-4 sm:p-5">
              {enrollments.length === 0 ? (
                <div className="text-center py-6">
                  <HiBookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 mb-3">
                    No enrollments yet
                  </p>
                  <Link
                    to="/student/courses"
                    className="btn btn-primary text-sm"
                  >
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 4).map((e) => (
                    <Link
                      key={e._id}
                      to={`/student/courses/${e?.course?._id}`}
                      className="block border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-primary-300 transition"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                            {e?.course?.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <HiClock className="w-3 h-3" /> In Progress
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary-600 dark:text-primary-400">
                            {e.progress}%
                          </p>
                          {e.progress === 100 && (
                            <HiCheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 mt-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
                          style={{ width: `${e.progress}%` }}
                        ></div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* AVAILABLE COURSES */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Available Courses
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Explore new learning opportunities
                </p>
              </div>
              <Link
                to="/student/courses"
                className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
              >
                View all
              </Link>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {items.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400">
                  No courses available
                </p>
              ) : (
                items.slice(0, 4).map((c) => (
                  <Link
                    key={c._id}
                    to={`/student/courses/${c._id}`}
                    className="flex justify-between items-center border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                        <HiBookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                          {c.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.category} • {c.difficulty}
                        </p>
                      </div>
                    </div>
                    <HiArrowRight className="w-5 h-5 text-slate-400" />
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
