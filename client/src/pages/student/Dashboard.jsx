import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { myEnrollments, fetchCourses } from "../../slices/courseSlice.js";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "react-icons/hi2";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { enrollments, items } = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);


  // ✅ Fetch Enrollments and Courses
  useEffect(() => {
    dispatch(myEnrollments());
    dispatch(fetchCourses());
  }, [dispatch]);

  // ✅ Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/student/profile");
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
  const fetchLiveSessions = async () => {
    try {
      const { data } = await api.get("/student/live-sessions");
      setLiveSessions(data);
    } catch (err) {
      console.error("❌ Failed to fetch sessions:", err);
    }
  };
  
  fetchLiveSessions();
}, []);


  // ✅ Stats Calculations
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
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "In Progress",
      value: inProgressCourses,
      icon: HiChartBar,
      gradient: "from-yellow-500 to-yellow-600",
      lightBg: "bg-yellow-50 dark:bg-yellow-950/30",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Completed",
      value: completedCourses,
      icon: HiCheckCircle,
      gradient: "from-green-500 to-green-600",
      lightBg: "bg-green-50 dark:bg-green-950/30",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      label: "Avg Progress",
      value: `${avgProgress}%`,
      icon: HiAcademicCap,
      gradient: "from-primary-500 to-primary-600",
      lightBg: "bg-primary-50 dark:bg-primary-950/30",
      textColor: "text-primary-600 dark:text-primary-400",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HiSparkles className="w-6 h-6 text-yellow-300" />
                <span className="text-primary-100 text-sm font-medium">
                  Welcome back!
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Hello, {profile?.name || user?.name}! 👋
              </h2>
              <p className="text-primary-100 text-lg max-w-2xl">
                Continue your learning journey and achieve your goals.
              </p>
            </div>
            {completedCourses > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30">
                <HiTrophy className="w-6 h-6 text-yellow-300" />
                <div>
                  <p className="text-xs text-primary-100">Completed</p>
                  <p className="text-xl font-bold text-white">
                    {completedCourses}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* LIVE SESSIONS SECTION */}
<motion.div
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.8 }}
  className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
>
  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Live Sessions</h3>
  </div>
  <div className="p-6 space-y-3">
    {liveSessions.length === 0 ? (
      <p className="text-slate-500 dark:text-slate-400">No upcoming sessions</p>
    ) : (
      liveSessions.map((session) => (
        <div key={session._id} className="flex items-center justify-between border-b border-slate-200 pb-3 last:border-none">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{session.title}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(session.date).toLocaleString()}
            </p>
          </div>
          <a
            href={session.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary text-sm"
          >
            Join Live
          </a>
        </div>
      ))
    )}
  </div>
</motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.2 }}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}
              ></div>
              <div className="relative">
                <div
                  className={`${stat.lightBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 ${stat.textColor}`} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout (My Courses + Available Courses) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  My Courses
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Track your learning progress
                </p>
              </div>
              <Link
                to="/student/courses"
                className="flex items-center gap-1 px-4 py-2 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors font-medium text-sm"
              >
                View all
                <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <HiBookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4 font-medium">
                  No enrollments yet
                </p>
                <Link
                  to="/student/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <HiSparkles className="w-5 h-5" />
                  Browse courses
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 5).map((e) => (
                  <Link
                    key={e.id}
                    to={`/student/courses/${e.course._id}`}
                    className="group block p-5 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-1">
                          {e.course.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <HiClock className="w-3 h-3" />
                          <span>In progress</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                          {e.progress}%
                        </span>
                        {e.progress === 100 && (
                          <HiCheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${e.progress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Available Courses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Available Courses
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Explore new learning opportunities
                </p>
              </div>
              <Link
                to="/student/courses"
                className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
              >
                View all
                <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <HiBookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  No courses available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.slice(0, 5).map((c) => (
                  <Link
                    key={c._id}
                    to={`/student/courses/${c._id}`}
                    className="group flex items-center justify-between p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <HiBookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {c.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {c.category} • {c.difficulty}
                        </p>
                      </div>
                    </div>
                    <HiArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
