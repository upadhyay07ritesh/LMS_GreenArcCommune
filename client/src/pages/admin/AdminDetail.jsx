// src/pages/admin/AdminDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import {
  HiArrowLeft,
  HiUserCircle,
  HiEnvelope,
  HiCalendar,
  HiCheckCircle,
  HiNoSymbol,
} from "react-icons/hi2";

export default function AdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = async () => {
    try {
      const { data } = await api.get(`/manage-admins/admins/${id}`);
      setAdmin(data.admin);
    } catch (error) {
      console.error("Failed to fetch admin details:", error);
      // Handle 404 or other errors
      if (error.response?.status === 404) {
        navigate('/admin/manage-admins', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">
            Loading admin details...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        Admin not found
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Admin Details
        </h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center text-4xl font-bold">
            {admin.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {admin.name}
          </h2>
          <div className="text-slate-600 dark:text-slate-400 text-sm space-y-2">
            <p className="flex items-center gap-2">
              <HiEnvelope className="w-4 h-4" /> {admin.email}
            </p>
            {admin.createdAt && (
              <p className="flex items-center gap-2">
                <HiCalendar className="w-4 h-4" /> Joined on{" "}
                {new Date(admin.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                admin.status === "active"
                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              }`}
            >
              {admin.status === "active" ? (
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
    </motion.div>
  );
}
