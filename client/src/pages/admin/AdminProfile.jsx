// AdminProfile.jsx – Clean + Glass + Breadcrumb + Soft Animations

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  HiPencil,
  HiCheck,
  HiXMark,
  HiCamera,
  HiArrowRightOnRectangle,
} from "react-icons/hi2";
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import { logout } from "../../slices/authSlice";

export default function AdminProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [admin, setAdmin] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    adminId: "",
    avatar: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data.user;
        setAdmin(u);
        setFormData({
          name: u.name,
          email: u.email,
          department: u.adminMeta?.department || "",
          adminId: u.adminId || "",
          avatar: u.avatar || "",
        });
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append(
        "adminMeta",
        JSON.stringify({
          department: formData.department,
        })
      );
      if (avatarFile) data.append("profilePhoto", avatarFile);

      const res = await api.put("/auth/update-profile", data);
      const updated = res.data.user;

      setAdmin(updated);
      setFormData({
        name: updated.name,
        email: updated.email,
        department: updated.adminMeta?.department || "",
        adminId: updated.adminId,
        avatar: updated.avatar || "",
      });

      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (admin) {
      setFormData({
        name: admin.name,
        email: admin.email,
        department: admin.adminMeta?.department || "",
        adminId: admin.adminId,
        avatar: admin.avatar || "",
      });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    try {
      dispatch(logout());
    } catch {}
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 pb-10">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="
      flex items-center gap-2 px-3 py-2 
      rounded-lg border border-slate-300 dark:border-slate-700
      text-slate-700 dark:text-slate-300 
      hover:bg-slate-100 dark:hover:bg-slate-800
      transition
    "
        >
          <HiArrowRightOnRectangle className="w-4 h-4 rotate-180" />
          Back
        </button>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Admin Profile
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your personal information
          </p>
        </div>
      </div>

      {/* HEADER CARD – Glass Effect */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          relative rounded-xl 
          backdrop-blur-xl bg-white/50 dark:bg-slate-900/40 
          border border-white/40 dark:border-slate-700/40 
          shadow-lg p-6 hover:shadow-xl transition-shadow
        "
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div
              className="
              w-28 h-28 rounded-full overflow-hidden 
              shadow-md bg-white dark:bg-slate-900 
              border border-slate-200 dark:border-slate-700
              transition-transform hover:scale-[1.02]
            "
            >
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-semibold text-slate-500 flex items-center justify-center h-full">
                  {formData.name.charAt(0)}
                </span>
              )}
            </div>

            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 shadow">
                <HiCamera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {formData.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {formData.email}
            </p>

            {!isEditing && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  <HiPencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => navigate("/admin/change-password")}
                  className="btn btn-outline"
                >
                  Change Password
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* DETAILS CARD – Glass + Dividers */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          mt-8 rounded-xl 
          backdrop-blur-xl bg-white/50 dark:bg-slate-900/40 
          border border-white/40 dark:border-slate-700/40 
          shadow-lg p-8 hover:shadow-xl transition-shadow
        "
      >
        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-6">
          Profile Information
        </h3>

        {/* Divider */}
        <div className="border-b border-slate-200/60 dark:border-slate-700/60 mb-6"></div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input w-full transition-all hover:shadow-sm"
                value={formData.name}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input w-full transition-all hover:shadow-sm"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="label">Department</label>
              <input
                className="input w-full transition-all hover:shadow-sm"
                value={formData.department}
                onChange={(e) =>
                  setFormData((s) => ({ ...s, department: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-slate-500 mb-1">Name</p>
              <p className="font-medium">{admin.name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Admin ID</p>
              <p className="font-medium">{admin.adminId}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Email</p>
              <p className="font-medium">{admin.email}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Department</p>
              <p className="font-medium">
                {admin.adminMeta?.department || "—"}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Logout */}
      <div className="mt-8 flex justify-end">
        <button onClick={handleLogout} className="btn btn-outline gap-2">
          <HiArrowRightOnRectangle className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
