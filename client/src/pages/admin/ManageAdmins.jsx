import { use, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  HiMagnifyingGlass,
  HiFunnel,
  HiUserGroup,
  HiUserCircle,
  HiEnvelope,
  HiCheckCircle,
  HiNoSymbol,
  HiTrash,
  HiPlus,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";

export default function ManageAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 15;

  const loadAdmins = async () => {
    try {
      const { data } = await api.get("/manage-admins/admins");
      setAdmins(data);
    } catch (error) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAdmins();
  }, []); 

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/manage-admins/admins/${id}/status`, {
        status,
      });
      setAdmins((prev) => prev.map((a) => (a._id === id ? data.admin : a)));
      toast.success(
        `Admin ${status === "banned" ? "banned" : "activated"} successfully`
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteAdmin = async (id) => {
    try {
      await api.delete(`/manage-admins/admins/${id}`);
      setAdmins((prev) => prev.filter((a) => a._id !== id));
      toast.success("Admin deleted successfully");
    } catch {
      toast.error("Failed to delete admin");
    }
  };

  // 🔍 Filter + Pagination logic
  const filteredAdmins = admins.filter((admin) => {
    const matchSearch =
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "All" || admin.status === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const startIndex = (currentPage - 1) * adminsPerPage;
  const currentAdmins = filteredAdmins.slice(
    startIndex,
    startIndex + adminsPerPage
  );
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);

  // 🧠 Empty / Loading states
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-300 border-t-primary-600 rounded-full"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading admins...
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 🧭 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Manage Admins
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Create, monitor and control all administrative accounts.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/add-admin")}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-md"
        >
          <HiPlus className="w-5 h-5" /> Add Admin
        </button>
      </div>

      {/* 🔍 Search + Filter */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-4"
      >
        <div className="flex items-center flex-1 gap-3">
          <div className="relative flex-1">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search admins by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="relative w-48">
            <HiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Banned">Banned</option>
            </select>
          </div>
        </div>

        {/* Gmail-style Pagination Info */}
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>
            {startIndex + 1}–
            {Math.min(startIndex + currentAdmins.length, filteredAdmins.length)}{" "}
            of {filteredAdmins.length}
          </span>
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 🧾 Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
      >
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Admin</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {currentAdmins.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-12 text-slate-500 dark:text-slate-400"
                >
                  No admins found.
                </td>
              </tr>
            ) : (
              currentAdmins.map((admin, index) => (
                <tr
                  key={admin._id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                  onClick={() => navigate(`/admin/${admin._id}`)} // ✅ Go to AdminDetail
                >
                  <td className="px-6 py-4 text-sm">
                    {startIndex + index + 1}
                  </td>

                  {/* ✅ Combined Avatar + Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <HiUserCircle className="w-9 h-9 text-slate-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {admin.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <HiEnvelope className="w-4 h-4 text-slate-400" />
                      {admin.email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        admin.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {admin.status === "active" ? "Active" : "Banned"}
                    </span>
                  </td>

                  <td
                    className="px-6 py-4 text-right"
                    onClick={(e) => e.stopPropagation()} // stop row click when clicking buttons
                  >
                    <div className="flex justify-end gap-2">
                      {admin.status === "active" ? (
                        <button
                          onClick={() => updateStatus(admin._id, "banned")}
                          className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100"
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatus(admin._id, "active")}
                          className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-100"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => deleteAdmin(admin._id)}
                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
