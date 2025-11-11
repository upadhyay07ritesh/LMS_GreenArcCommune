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

  // Get the next student ID from the server
  const fetchStudentId = async () => {
    try {
      const res = await api.get("/admin/students/latest-id");
      // Use the ID directly from the server
      if (res.data?.lastId) {
        setStudentId(res.data.lastId);
      } else {
        // Fallback in case the server doesn't return an ID
        setStudentId("GACSTD202501");
      }
    } catch (err) {
      console.error("Failed to fetch student ID", err);
      toast.warning("Could not fetch student ID, using default pattern");
      setStudentId("GACSTD202501");
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
    const { name, value, selectionStart } = e.target;
    
    if (name === 'dob') {
      // Store cursor position
      const cursorPosition = selectionStart;
      const previousLength = formData.dob?.length || 0;
      
      // Remove all non-digit characters
      let digits = value.replace(/\D/g, '');
      
      // Format as user types
      let formatted = '';
      for (let i = 0; i < digits.length; i++) {
        if (i === 2) formatted += '/';
        if (i === 4) formatted += '/';
        if (i === 8) break; // Limit to DD/MM/YYYY format
        formatted += digits[i];
      }
      
      // Update the input value
      e.target.value = formatted;
      
      // Adjust cursor position
      const addedChars = formatted.length - previousLength;
      const newCursorPos = cursorPosition + (addedChars > 0 ? 1 : 0);
      
      // Set cursor position after the state update
      setTimeout(() => {
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
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
    
    // Date of Birth validation
    if (!formData.dob.trim()) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
      if (!dateRegex.test(formData.dob)) {
        newErrors.dob = "Please enter date in DD/MM/YYYY format";
      } else {
        // Additional validation for valid date (e.g., not 31/02/2023)
        const [day, month, year] = formData.dob.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
          newErrors.dob = "Please enter a valid date";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate password: 4 initials of name + year of birth
  const generatePassword = () => {
    const initials = formData.name
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 4);

    // Extract year from DD/MM/YYYY format
    let year = "";
    if (formData.dob) {
      const parts = formData.dob.split('/');
      if (parts.length === 3) {
        year = parts[2]; // Get the year part (third part in DD/MM/YYYY)
      }
    }

    return `${initials}${year}`;
  };

  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return "";
    const [day, month, year] = dateStr.split("/");
    // Convert to YYYY-MM-DD format for the backend
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
      // Convert DD/MM/YYYY to YYYY-MM-DD for the backend
      submitData.append("dob", formatDateForBackend(formData.dob));
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
                label="Date of Birth (DD/MM/YYYY)"
                name="dob"
                type="text"
                value={formData.dob}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                maxLength="10"
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
