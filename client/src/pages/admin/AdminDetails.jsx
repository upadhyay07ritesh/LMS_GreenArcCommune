import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import { toast } from "react-toastify";
import {
  HiArrowLeft,
  HiEnvelope,
  HiIdentification,
  HiCalendar,
  HiShieldCheck,
  HiCheckCircle,
  HiNoSymbol,
  HiTrash,
  HiBuildingOffice2,
  HiPencilSquare,
} from "react-icons/hi2";

export default function AdminDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===========================================================
     🔁 Load Admin Data (Cache-Proof + JSON Safe)
  =========================================================== */
  const loadAdmin = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admins/${id}`, {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        params: { _: Date.now() },
      });

      if (response?.data?.success && response.data.admin) {
        const adminData = response.data.admin;
        // Ensure adminMeta exists with default values
        if (!adminData.adminMeta) {
          adminData.adminMeta = {
            permissions: [],
            department: ""
          };
        } else if (!Array.isArray(adminData.adminMeta.permissions)) {
          adminData.adminMeta.permissions = adminData.adminMeta.permissions 
            ? [adminData.adminMeta.permissions] 
            : [];
        }
        setAdmin(adminData);
      } else {
        console.error("Invalid response format:", response);
        toast.error("Failed to load admin details: Invalid response format");
      }
    } catch (error) {
      console.error("Failed to fetch admin details:", error);
      toast.error("Failed to load admin details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, [id]);

  /* ===========================================================
     🗑️ Delete Admin
  =========================================================== */
  const deleteAdmin = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${admin?.name}?`)) {
      return;
    }

    try {
      await api.delete(`/admins/${id}`);
      toast.success(`🗑️ ${admin?.name || 'Admin'} deleted successfully`);
      navigate("/admin/manage-admins");
    } catch (error) {
      console.error("Failed to delete admin:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete admin";
      toast.error(errorMessage);
    }
  };

  /* ===========================================================
     🕓 Loading / Not Found
  =========================================================== */
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

  /* ===========================================================
     🧱 UI
  =========================================================== */
  return (
    <div className="min-h-screen pb-24 overflow-visible">
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
              Admin Details
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* ✏️ Edit Button */}
            <button
              onClick={() => navigate(`/admin/manage-admins/${admin.id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-950/50 transition-colors font-medium"
            >
              <HiPencilSquare className="w-5 h-5" />
              Edit Admin
            </button>

            {/* 🗑️ Delete Button */}
            <button
              onClick={deleteAdmin}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors font-medium"
            >
              <HiTrash className="w-5 h-5" />
              Delete
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24">
              {admin.avatar ? (
                <img
                  src={
                    admin.avatar?.startsWith("data:image")
                      ? admin.avatar
                      : `http://localhost:5000${admin.avatar}`
                  }
                  alt={admin.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-500 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                  {admin.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {admin.name}
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-700 dark:text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <HiEnvelope className="w-4 h-4 text-slate-400" /> {admin.email}
              </div>
              {admin.adminId && (
                <div className="flex items-center gap-2">
                  <HiIdentification className="w-4 h-4 text-slate-400" />
                  {admin.adminId}
                </div>
              )}
              {admin.role && (
                <div className="flex items-center gap-2">
                  <HiShieldCheck className="w-4 h-4 text-slate-400" />
                  {admin.role?.toUpperCase()}
                </div>
              )}
              {admin.createdAt && (
                <div className="flex items-center gap-2">
                  <HiCalendar className="w-4 h-4 text-slate-400" />
                  Joined on{" "}
                  {new Date(admin.createdAt).toLocaleDateString("en-IN")}
                </div>
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

        {/* Full Info Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 space-y-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Profile Information
          </h3>

          <p>
            <strong>Admin ID:</strong> {admin.adminId || "N/A"}
          </p>
          <p>
            <strong>Email:</strong> {admin.email}
          </p>
          <p>
            <strong>Role:</strong> {admin.role?.toUpperCase() || "N/A"}
          </p>
          {admin?.adminMeta && (
            <>
              <p>
                <strong>Department:</strong>{" "}
                {admin.adminMeta.department || "N/A"}
              </p>
              <p>
                <strong>Permissions:</strong>{" "}
                {Array.isArray(admin.adminMeta.permissions)
                  ? admin.adminMeta.permissions.join(", ")
                  : "None"}
              </p>
            </>
          )}
          {admin.lastPasswordChange && (
            <p>
              <strong>Last Password Change:</strong>{" "}
              {new Date(admin.lastPasswordChange).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
