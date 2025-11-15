import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import FormInput from "../../components/form/FormInput.jsx";
import FileUpload from "../../components/form/FileUpload.jsx";
import {
  HiUserPlus,
  HiUser,
  HiEnvelope,
  HiBuildingOffice,
  HiCheckCircle,
  HiXMark,
  HiIdentification,
  HiLockClosed,
  HiArrowPath,
  HiArrowLeft,
} from "react-icons/hi2";

const initialFormState = {
  name: "",
  email: "",
  department: "",
  permissions: [],
  role: "admin",
};

export default function AddAdmin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [adminId, setAdminId] = useState("");
  const [idLoading, setIdLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [roleMessage, setRoleMessage] = useState("");
  const { id } = useParams();
  const isEdit = Boolean(id);

  const availablePermissions = [
    { key: "manage_users", label: "Manage Students" },
    { key: "manage_courses", label: "Manage Courses" },
    { key: "manage_admins", label: "Manage Admins" },
    { key: "manage_live_sessions", label: "Manage Live Sessions" },
    { key: "view_analytics", label: "View Analytics Dashboard" },
  ];

  /* =======================================================
     🔁 Fetch Latest Admin ID
  ======================================================= */
  useEffect(() => {
    if (isEdit) {
      loadAdmin();
      fetchAdminId();
    }
  }, [id]);

  useEffect(() => {
    if (!isEdit) {
      fetchAdminId();
    }
  }, [retryCount, isEdit]);

  /* =======================================================
   🎯 Auto-assign permissions when role is superadmin
======================================================= */
  useEffect(() => {
    if (formData.role === "superadmin") {
      // Auto-select all permissions
      setFormData((prev) => ({
        ...prev,
        permissions: availablePermissions.map((p) => p.key),
      }));
    }
  }, [formData.role]);

  const loadAdmin = async () => {
    try {
      const { data } = await api.get(`/manage-admins/admins/${id}`);

      setAdminId(data.admin.adminId);

      setFormData({
        name: data.admin.name,
        email: data.admin.email,
        department: data.admin.adminMeta?.department || "",
        permissions: data.admin.adminMeta?.permissions || [],
        role: data.admin.role || "admin",
      });
    } catch (error) {
      toast.error("Failed to load admin details");
    }
  };

  const fetchAdminId = async () => {
    console.log("🔄 Fetching latest admin ID...");
    setIdLoading(true);
    try {
      const { data } = await api.get("/admins/latest-id");
      const nextId = data?.nextId || "GACADM001";
      setAdminId(nextId);
      console.log("✅ Next Admin ID:", nextId);
    } catch (error) {
      console.error("❌ Failed to fetch last admin ID:", error);
      toast.warning("Could not fetch latest admin ID, using fallback.");
      setAdminId(`GACADM${Math.floor(100 + Math.random() * 900)}`);
    } finally {
      setIdLoading(false);
    }
  };

  /* =======================================================
     🧩 Form Logic
  ======================================================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePermissionToggle = (key) => {
  setFormData((prev) => {
    let updatedPermissions = prev.permissions.includes(key)
      ? prev.permissions.filter((p) => p !== key)
      : [...prev.permissions, key];

    const allSelected =
      updatedPermissions.length === availablePermissions.length;

    // If superadmin removes one permission → switch to admin
    let updatedRole = prev.role;
    if (prev.role === "superadmin" && !allSelected) {
      updatedRole = "admin";
      setRoleMessage(
        "Permission removed — role downgraded to Admin. Select custom permissions."
      );
    }

    // If admin selects all permissions → switch to superadmin
    if (prev.role === "admin" && allSelected) {
      updatedRole = "superadmin";
      setRoleMessage(
        "All permissions selected — role automatically upgraded to Super Admin."
      );
    }

    return {
      ...prev,
      permissions: updatedPermissions,
      role: updatedRole,
    };
  });
};
  const handleRoleChange = (e) => {
  const selectedRole = e.target.value;

  if (selectedRole === "superadmin") {
    setFormData((prev) => ({
      ...prev,
      role: "superadmin",
      permissions: availablePermissions.map((p) => p.key),
    }));

    setRoleMessage("Super Admin – all permissions are automatically enabled.");
  }

  if (selectedRole === "admin") {
    // If admin is selected but all permissions are already selected → convert to superadmin
    const allSelected =
      formData.permissions.length === availablePermissions.length;

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        role: "superadmin",
      }));
      setRoleMessage(
        "All permissions are selected. Role automatically changed to Super Admin."
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      role: "admin",
    }));

    setRoleMessage("Admin role selected — please choose custom permissions.");
  }
};


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: "File size must be less than 5MB",
      }));
      return;
    }
    setProfilePhoto(file);
    setErrors((prev) => ({ ...prev, profilePhoto: "" }));
  };

  /* =======================================================
     ✅ Validation
  ======================================================= */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    else if (formData.name.trim().length < 3)
      newErrors.name = "Name must be at least 3 characters long";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email address";

    if (formData.permissions.length === 0)
      newErrors.permissions = "Select at least one permission";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =======================================================
     🔐 Password Generator
  ======================================================= */
  const generatePassword = () => {
    const initials = formData.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .slice(0, 4);
    const random = Math.floor(100 + Math.random() * 900);
    return `${initials}${random}`;
  };

  /* =======================================================
     🚀 Submit Handler
  ======================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warn("Please fix the form errors first.");
      return;
    }

    setLoading(true);

    try {
      // 1. First, verify the current session is still valid
      const verifyResponse = await api.get("/auth/me");
      if (!verifyResponse.data?.user) {
        throw new Error("Session expired. Please log in again.");
      }

      // 2. Get current token
      const currentToken =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
      if (!currentToken) {
        throw new Error("No authentication token found");
      }

      // 3. Create form data
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("role", formData.role);
      submitData.append("status", "active");
      submitData.append("department", formData.department);

      submitData.append("permissions", JSON.stringify(formData.permissions));

      if (profilePhoto) {
        submitData.append("profilePhoto", profilePhoto);
      }

      // 4. Make the API request with the current token
      // const response = await api.post("/manage-admins/admins", submitData, {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //     Authorization: `Bearer ${currentToken}`,
      //     "X-Requested-With": "XMLHttpRequest",
      //   },
      //   // Prevent axios from automatically following redirects
      //   maxRedirects: 0,
      //   validateStatus: (status) => status >= 200 && status < 400,
      //   withCredentials: true,
      // });

      let response;

      if (isEdit) {
        response = await api.put(`/manage-admins/admins/${id}`, submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${currentToken}`,
            "X-Requested-With": "XMLHttpRequest",
          },
          // Prevent axios from automatically following redirects
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
          withCredentials: true,
        });
      } else {
        response = await api.post("/manage-admins/admins", submitData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${currentToken}`,
            "X-Requested-With": "XMLHttpRequest",
          },
          // Prevent axios from automatically following redirects
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
          withCredentials: true,
        });
      }
      // 5. Handle the response
      if (response.data?.success) {
        // Always ensure we have a valid token
        if (response.data.token) {
          localStorage.setItem("adminToken", response.data.token);
        } else if (currentToken) {
          // If no new token, ensure the current one is still set
          localStorage.setItem("adminToken", currentToken);
        }

        // Show success message
        toast.success(response.data.message || "✅ Admin added successfully!");

        // Verify session is still valid
        try {
          const meResponse = await api.get("/auth/me", {
            headers: {
              Authorization: `Bearer ${response.data.token || currentToken}`,
            },
          });

          if (!meResponse.data?.user) {
            throw new Error("Session verification failed");
          }

          // Update user data in local storage
          localStorage.setItem("user", JSON.stringify(meResponse.data.user));
          localStorage.setItem("userRole", meResponse.data.user.role);
        } catch (refreshError) {
          console.warn("Session verification failed:", refreshError);
          // If verification fails, redirect to login
          localStorage.clear();
          window.location.href = "/login";
          return;
        }
        // Redirect to admin list
        setTimeout(() => navigate("/admin/manage-admins"), 800);
      } else {
        throw new Error(response.data?.message || "Failed to add admin");
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      const msg =
        error.response?.data?.message || error.message || "Failed to add admin";
      toast.error(msg);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     🔁 Reset / Cancel
  ======================================================= */
  const handleReset = () => {
    setFormData(initialFormState);
    setProfilePhoto(null);
    setErrors({});
    fetchAdminId();
  };

  const handleCancel = () => navigate("/manage-admins");


  /* =======================================================
     🧱 UI
  ======================================================= */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="
              inline-flex items-center gap-2 
              px-4 py-2 
              text-slate-700 dark:text-slate-300 
              bg-white dark:bg-slate-800
              border border-slate-300 dark:border-slate-600
              rounded-xl 
              shadow-sm 
              hover:bg-primary-600 hover:text-white hover:border-primary-600
              transition-all duration-200 
              hover:shadow-md 
              active:scale-95 mb-4
            "
          >
            <HiArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/30 rounded-xl flex items-center justify-center">
              <HiUserPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold ...">
              {isEdit ? "Edit Admin" : "Add New Admin"}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {isEdit
              ? "Update admin details and permissions"
              : "Define admin details and assign their permissions"}
          </p>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => setRetryCount((p) => p + 1)}
          type="button"
          className="flex items-center gap-2 text-sm px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
        >
          <HiArrowPath
            className={`w-4 h-4 ${idLoading ? "animate-spin" : ""}`}
          />
          Retry ID
        </button>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Admin Information
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {idLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  Fetching Admin ID...
                </span>
              ) : (
                <>
                  Admin ID: <strong>{adminId}</strong>
                </>
              )}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter admin's full name"
                required
                error={errors.name}
                icon={HiUser}
              />
              <FormInput
                label="Admin ID"
                name="adminId"
                value={adminId}
                disabled
                placeholder="Auto-generated"
                icon={HiIdentification}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                error={errors.email}
                icon={HiEnvelope}
              />
              <FormInput
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., IT, HR, Operations"
                icon={HiBuildingOffice}
              />
            </div>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Admin Role
              </label>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === "admin"}
                    onChange={handleRoleChange}
                    className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Admin
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="superadmin"
                    checked={formData.role === "superadmin"}
                    onChange={handleRoleChange}
                    className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    Super Admin
                  </span>
                </label>
              </div>
              {roleMessage && (
                <p className="text-sm mt-2 text-blue-600 dark:text-blue-400 font-medium">
                  {roleMessage}
                </p>
              )}
            </div>

            {/* Permissions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <HiLockClosed className="w-5 h-5 text-primary-500" />
                Access Permissions
              </h3>
              <p className="text-sm text-slate-500 mb-3">
                Select what this admin is allowed to manage:
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                {availablePermissions.map((perm) => (
                  <label
                    key={perm.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.key)}
                      onChange={() => handlePermissionToggle(perm.key)}
                      className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      {perm.label}
                    </span>
                  </label>
                ))}
              </div>

              {errors.permissions && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.permissions}
                </p>
              )}
            </div>

            {/* Profile Photo */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <FileUpload
                label="Profile Photo"
                name="profilePhoto"
                onChange={handleFileChange}
                accept="image/*"
                error={errors.profilePhoto}
                hint="Optional: Upload a profile picture (PNG, JPG, JPEG - Max 5MB)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              <HiXMark className="w-5 h-5" />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading || idLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEdit ? "Saving..." : "Adding Admin..."}
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-5 h-5" />
                  {isEdit ? "Save Changes" : "Add Admin"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
