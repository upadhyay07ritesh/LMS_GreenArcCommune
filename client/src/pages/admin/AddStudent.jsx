import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import FormInput from "../../components/form/FormInput.jsx";
import FormSelect from "../../components/form/FormSelect.jsx"; // ✅ Use for dropdown
import FileUpload from "../../components/form/FileUpload.jsx";
import {
  HiUserPlus,
  HiUser,
  HiEnvelope,
  HiPhone,
  HiCheckCircle,
  HiCalendar,
  HiAcademicCap,
  HiXMark,
  HiIdentification,
} from "react-icons/hi2";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  course: "",
  dob: "",
};

export default function AddStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [courses, setCourses] = useState([]); // ✅ store fetched courses

  // ✅ Fetch latest student ID & courses on mount
  useEffect(() => {
    fetchStudentId();
    fetchCourses();
  }, []);

  // ✅ Generate serial Student ID from backend
  const fetchStudentId = async () => {
    try {
      const res = await api.get("/admin/students/latest-id"); // Backend should return latest ID
      const lastId = res.data?.lastId || "GAC123000"; // fallback
      const nextNum = parseInt(lastId.replace("GAC", "")) + 1;
      setStudentId(`GAC${nextNum.toString().padStart(6, "0")}`);
    } catch (err) {
      console.error("Failed to fetch last student ID", err);
      toast.warning("Could not fetch latest student ID, using default pattern");
      setStudentId(`GAC${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

// ✅ Fetch courses for dropdown (include _id)
const fetchCourses = async () => {
  try {
    const res = await api.get("/admin/courses");

    // 🧠 Convert API data to { value: _id, label: name }
    const formattedCourses = res.data.map((course) => ({
      value: course._id,  // ✅ this will be sent to backend
      label: course.name, // ✅ this will show in dropdown
    }));

    setCourses(formattedCourses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    toast.error("Failed to load courses");
  }
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          profilePhoto: "File size must be less than 5MB",
        }));
        return;
      }
      setProfilePhoto(file);
      setErrors((prev) => ({ ...prev, profilePhoto: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    else if (formData.name.trim().length < 3)
      newErrors.name = "Name must be at least 3 characters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email address";

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!phoneRegex.test(formData.phone))
      newErrors.phone = "Invalid 10-digit number";

    if (!formData.course.trim()) newErrors.course = "Course enrolled is required";
    if (!formData.dob.trim()) newErrors.dob = "Date of birth is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Generate password: 4 initials of name + year of birth
  const generatePassword = () => {
    const initials = formData.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .slice(0, 4);
    const year = formData.dob ? new Date(formData.dob).getFullYear() : "";
    return `${initials}${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      const autoPassword = generatePassword();
      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("course", formData.course);
      submitData.append("dob", formData.dob);
      submitData.append("role", "student");
      submitData.append("studentId", studentId);
      submitData.append("password", autoPassword);
      submitData.append("status", "active");

      if (profilePhoto) submitData.append("profilePhoto", profilePhoto);

      await api.post("/admin/students", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Student added successfully!`);
      navigate("/admin/students");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add student";
      toast.error(msg);
      if (error.response?.data?.errors)
        setErrors(error.response.data.errors);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setProfilePhoto(null);
    setErrors({});
    fetchStudentId();
  };

  const handleCancel = () => navigate("/admin/students");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/30 rounded-xl flex items-center justify-center">
              <HiUserPlus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Add New Student
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Fill in the details below to create a new student account
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <form onSubmit={handleSubmit}>
          {/* Form Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Student Information
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Student ID: <strong>{studentId}</strong>
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter student's full name"
                required
                error={errors.name}
                icon={HiUser}
              />

              <FormInput
                label="Student ID"
                name="studentId"
                value={studentId}
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
                placeholder="student@example.com"
                required
                error={errors.email}
                icon={HiEnvelope}
              />

              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="1234567890"
                required
                error={errors.phone}
                icon={HiPhone}
              />
            </div>

            {/* ✅ Dropdown for Course + DOB */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormSelect
                label="Course Enrolled"
                name="course"
                value={formData.course}
                onChange={handleChange}
                options={courses}
                required
                error={errors.course}
                icon={HiAcademicCap}
                placeholder="Select a course"
              />

              <FormInput
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                required
                error={errors.dob}
                icon={HiCalendar}
              />
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
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding Student...
                </>
              ) : (
                <>
                  <HiCheckCircle className="w-5 h-5" />
                  Add Student
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
