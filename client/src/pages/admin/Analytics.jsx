import { useEffect, useState } from "react";
import api from "../../api/axios.js";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import TradingTrendLoader from "../../components/ui/ProTradingLoader.jsx";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const { data } = await api.get("/admin/analytics");
      setStats(data);
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();

    // 🧠 Optional auto-refresh every 10 seconds for real-time trends
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-slate-900">
        <TradingTrendLoader size={200} color="#22c55e" />
      </div>
    );
  }

  // 📊 Format chart data
  const enrollmentData =
    stats.enrollmentsByMonth?.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      enrollments: item.count,
    })) || [];

  const categoryData =
    stats.categoryStats?.map((item) => ({
      name: item._id,
      value: item.count,
    })) || [];

  const popularCoursesData =
    stats.popularCourses?.map((item) => ({
      name:
        item.title.length > 20
          ? item.title.substring(0, 20) + "..."
          : item.title,
      enrollments: item.enrollments,
    })) || [];

  // 📈 Dynamic stat cards with growth animation
  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents ?? 0,
      color: "text-blue-600 dark:text-blue-400",
      trend: "+12%",
    },
    {
      label: "Active Students",
      value: stats.activeStudents ?? 0,
      color: "text-green-600 dark:text-green-400",
      trend: "+5%",
    },
    {
      label: "Total Courses",
      value: stats.totalCourses ?? 0,
      color: "text-purple-600 dark:text-purple-400",
      trend: "+8%",
    },
    {
      label: "Active Courses",
      value: stats.activeCourses ?? 0,
      color: "text-indigo-600 dark:text-indigo-400",
      trend: "+4%",
    },
    {
      label: "Total Enrollments",
      value: stats.totalEnrollments ?? 0,
      color: "text-amber-600 dark:text-amber-400",
      trend: "+18%",
    },
    {
      label: "Unique Enrolled Students",
      value: stats.uniqueEnrolledStudents ?? 0,
      color: "text-emerald-600 dark:text-emerald-400",
      trend: "+10%",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Insights into your platform performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300"
          >
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              {card.label}
            </p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {card.value.toLocaleString()}
              </p>
              <span
                className={`text-xs font-semibold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg ${card.color}`}
              >
                {card.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Enrollment Trends (Last 6 Months)
          </h3>
          {enrollmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Enrollments"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400">
              No enrollment data available
            </p>
          )}
        </motion.div>

        {/* Courses by Category */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Courses by Category
          </h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400">
              No category data available
            </p>
          )}
        </motion.div>

        {/* Popular Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Most Popular Courses
          </h3>
          {popularCoursesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularCoursesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="enrollments" fill="#22c55e" name="Enrollments" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400">
              No course popularity data available
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
