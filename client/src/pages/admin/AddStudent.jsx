import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import FormInput from "../../components/form/FormInput.jsx";
import FormSelect from "../../components/form/FormSelect.jsx";
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
  HiUserGroup,
  HiCreditCard,
  HiArrowLeft,
} from "react-icons/hi2";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  course: "",
  dob: "",
  gender: "male",
  paymentStatus: "demo",
  aadharNumber: "",
};

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const paymentStatusOptions = [
  { value: "paid", label: "Paid" },
  { value: "demo", label: "Demo" },
];

export default function AddStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [courses, setCourses] = useState([]);
  const { id } = useParams();
  const isEdit = Boolean(id);

  // Fetch Student ID + Courses
  useEffect(() => {
    if (isEdit) {
      loadStudent();
    } else {
      fetchStudentId();
    }
    fetchCourses();
  }, [id]);

  const loadStudent = async () => {
    try {
      const { data } = await api.get(`/admin/students/${id}`);

      setStudentId(data.studentId);
      const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        const dateObj = new Date(isoDate);
        const d = String(dateObj.getDate()).padStart(2, "0");
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`; // form ke DD/MM/YYYY format ke hisaab se
      };

      setFormData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        course: data.course?._id || "",
        dob: formatDateForInput(data.dob),
        gender: data.gender,
        paymentStatus: data.paymentStatus,
        aadharNumber: data.aadharNumber,
      });
    } catch (err) {
      toast.error("Failed to load student");
    }
  };

  const fetchStudentId = async () => {
    try {
      const res = await api.get("/admin/students/latest-id");
      setStudentId(res.data?.lastId || "GACSTD202501");
    } catch (err) {
      toast.warning("Could not fetch student ID, using default pattern");
      setStudentId("GACSTD202501");
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      setCourses(
        res.data.map((course) => ({
          value: course._id,
          label: course.name,
        }))
      );
    } catch (err) {
      toast.error("Failed to load courses");
    }
  };

  const handleChange = (e) => {
    const { name, value, selectionStart } = e.target;

    // DOB formatting — DD/MM/YYYY
    if (name === "dob") {
      const cursor = selectionStart;
      const prevLength = formData.dob?.length || 0;

      let digits = value.replace(/\D/g, "");
      let formatted = "";

      for (let i = 0; i < digits.length; i++) {
        if (i === 2) formatted += "/";
        if (i === 4) formatted += "/";
        if (i === 8) break;
        formatted += digits[i];
      }

      e.target.value = formatted;

      const added = formatted.length - prevLength;
      const newCursorPos = cursor + (added > 0 ? 1 : 0);

      setTimeout(() => {
        e.target.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);

      setFormData((prev) => ({ ...prev, dob: formatted }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePaymentChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: value,
      ...(value === "demo" ? { aadharNumber: "" } : {}),
    }));

    if (errors.aadharNumber)
      setErrors((prev) => ({ ...prev, aadharNumber: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: "File must be below 5MB",
      }));
      return;
    }
    setProfilePhoto(file);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    else if (formData.name.trim().length < 3)
      newErrors.name = "Name must be at least 3 characters";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email";

    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!phoneRegex.test(formData.phone))
      newErrors.phone = "Phone must be 10 digits";

    if (!formData.course.trim()) newErrors.course = "Course is required";

    // DOB Validation
    if (!formData.dob.trim()) {
      newErrors.dob = "DOB is required";
    } else {
      const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
      if (!regex.test(formData.dob)) newErrors.dob = "Use DD/MM/YYYY format";
    }

    // Aadhar validation only when paid
    // if (formData.paymentStatus === "paid") {
    //   if (!formData.aadharNumber.trim())
    //     newErrors.aadharNumber = "Aadhar required for paid";
    //   else if (!/^\d{12}$/.test(formData.aadharNumber))
    //     newErrors.aadharNumber = "Aadhar must be 12 digits";
    // }

    // Aadhar is optional, validate only if entered
    if (formData.aadharNumber.trim()) {
      if (!/^\d{12}$/.test(formData.aadharNumber)) {
        newErrors.aadharNumber = "Aadhar must be 12 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password generator
  const generatePassword = () => {
    const initials = formData.name
      .trim()
      .toLowerCase()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 4);

    const year = formData.dob.split("/")[2];
    return `${initials}${year}`;
  };

  const formatDateForBackend = (dateStr) => {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix errors");
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();

      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("course", formData.course);
      submitData.append("dob", formatDateForBackend(formData.dob));
      submitData.append("role", "student");
      submitData.append("studentId", studentId);
      submitData.append("password", generatePassword());
      submitData.append("status", "active");
      submitData.append("gender", formData.gender);
      submitData.append("paymentStatus", formData.paymentStatus);
      submitData.append("aadharNumber", formData.aadharNumber);

      if (profilePhoto) submitData.append("profilePhoto", profilePhoto);

      if (isEdit) {
        await api.put(`/admin/students/${id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Student updated successfully!");
      } else {
        await api.post("/admin/students", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Student added successfully!");
      }

      navigate("/admin/students");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add student");
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Student" : "Add New Student"}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {isEdit
              ? "Modify the student details"
              : "Fill in the details to create a new student account"}
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
          {/* Header */}
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
            {/* Row 1 */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                required
                error={errors.name}
                icon={HiUser}
              />

              <FormInput
                label="Student ID"
                name="studentId"
                value={studentId}
                disabled
                icon={HiIdentification}
              />
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                required
                error={errors.phone}
                icon={HiPhone}
                maxLength="10"
              />
            </div>

            {/* Row 3 */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormSelect
                label="Course Enrolled"
                name="course"
                value={formData.course}
                onChange={handleChange}
                options={courses}
                error={errors.course}
                icon={HiAcademicCap}
                placeholder="Select a course"
              />

              <FormInput
                label="Date of Birth (DD/MM/YYYY)"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                maxLength="10"
                required
                error={errors.dob}
                icon={HiCalendar}
              />
            </div>

            {/* Row 4 — gender + payment */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gender: e.target.value }))
                }
                options={genderOptions}
                icon={HiUserGroup}
              />

              <FormSelect
                label="Payment Status"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={(e) => handlePaymentChange(e.target.value)}
                options={paymentStatusOptions}
                icon={HiCreditCard}
              />
            </div>

            {/* Row 5 — Aadhar */}
            <FormInput
              label="Aadhar Number"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              // placeholder={
              //   formData.paymentStatus === "demo"
              //     ? "Not required for Demo"
              //     : "Enter 12-digit Aadhar"
              // }
              placeholder="Enter 12-digit Aadhar (Optional)"
              error={errors.aadharNumber}
              icon={HiIdentification}
              // disabled={formData.paymentStatus === "demo"}
              disabled={false}
            />

            {/* Profile Upload */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <FileUpload
                label="Profile Photo"
                name="profilePhoto"
                onChange={handleFileChange}
                accept="image/*"
                hint="PNG, JPG, JPEG — Max 5MB"
                error={errors.profilePhoto}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => navigate("/admin/students")}
              className="w-full sm:w-auto px-6 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg"
            >
              <HiXMark className="inline w-5 h-5 mr-2" />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {loading ? "Adding..." : isEdit ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
