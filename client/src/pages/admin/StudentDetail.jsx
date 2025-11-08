import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import { toast } from "react-toastify";
import {
  HiArrowLeft,
  HiUser,
  HiEnvelope,
  HiIdentification,
  HiAcademicCap,
  HiCalendar,
  HiCheckCircle,
  HiNoSymbol,
  HiBookOpen,
  HiClock,
  HiTrash, // 🧩 New Icon
} from "react-icons/hi2";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);

  /* ===========================================================
     🔁 Load Student Data
  =========================================================== */
  const loadStudent = async () => {
    try {
      const { data } = await api.get(`/admin/students/${id}`);
      setStudent(data);
    } catch (error) {
      console.error("Failed to fetch student details:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [id]);

  /* ===========================================================
     🗑️ Delete Student Function
  =========================================================== */
  const deleteStudent = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${student.name}?`))
      return;

    try {
      await api.delete(`/admin/students/${id}`);
      toast.success(`🗑️ ${student.name} deleted successfully`);
      navigate("/admin/students");
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast.error("Failed to delete student");
    }
  };

  /* ===========================================================
     🕓 Loading + Not Found States
  =========================================================== */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
            Loading student details...
          </p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        Student not found
      </div>
    );
  }

  /* ===========================================================
     🧱 UI
  =========================================================== */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Student Details
          </h1>
        </div>

        {/* 🗑️ Delete Button */}
        <button
          onClick={deleteStudent}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors font-medium"
        >
          <HiTrash className="w-5 h-5" />
          Delete Student
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start gap-6">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24">
            {student.avatar ? (
              <img
                src={
                  student.avatar?.startsWith("data:image")
                    ? student.avatar
                    : `http://localhost:5000${student.avatar}`
                }
                alt={student.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-primary-500 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {student.name}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-700 dark:text-slate-300 text-sm">
            <div className="flex items-center gap-2">
              <HiEnvelope className="w-4 h-4 text-slate-400" /> {student.email}
            </div>
            <div className="flex items-center gap-2">
              <HiIdentification className="w-4 h-4 text-slate-400" />{" "}
              {student.studentId}
            </div>
            {student.dob && (
              <div className="flex items-center gap-2">
                <HiCalendar className="w-4 h-4 text-slate-400" />{" "}
                {new Date(student.dob).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                student.status === "active"
                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              }`}
            >
              {student.status === "active" ? (
                <>
                  <HiCheckCircle className="w-3.5 h-3.5" /> Active
                </>
              ) : (
                <>
                  <HiNoSymbol className="w-3.5 h-3.5" /> Banned
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {[
          { id: "profile", label: "Profile" },
          { id: "enrollments", label: "Enrollments" },
          { id: "activity", label: "Activity Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary-600 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-primary-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiUser className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Name:</strong> {student.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiEnvelope className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Email:</strong> {student.email}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiIdentification className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Student ID:</strong> {student.studentId}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiAcademicCap className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Course:</strong>{" "}
                {student.enrolledCourses?.length
                  ? student.enrolledCourses.map((c) => c.title).join(", ")
                  : "Not enrolled in any course"}
              </span>
            </div>
          </div>
        )}

        {activeTab === "enrollments" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Enrolled Courses
            </h3>
            {student.enrolledCourses?.length ? (
              student.enrolledCourses.map((course) => (
                <div
                  key={course._id}
                  className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {course.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {course.category} • {course.difficulty}
                    </p>
                  </div>
                  <HiBookOpen className="w-6 h-6 text-primary-500" />
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                No enrollments found.
              </p>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
              Recent Activity
            </h3>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiClock className="w-5 h-5 text-slate-400" />
              <span>No recent activity recorded yet.</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
