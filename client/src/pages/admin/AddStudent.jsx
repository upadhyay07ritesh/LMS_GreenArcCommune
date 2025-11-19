import { useState, useEffect, useRef } from "react";
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
  const [profilePhoto, setProfilePhoto] = useState(null); // actual File (when user selects)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null); // URL or existing avatar url
  const [studentId, setStudentId] = useState("");
  const [courses, setCourses] = useState([]);
  const { id } = useParams();
  const isEdit = Boolean(id);

  // keep a ref to last created object URL to revoke it on change/unmount
  const lastObjectUrlRef = useRef(null);

  // Fetch Student ID + Courses
  useEffect(() => {
    if (isEdit) {
      loadStudent();
    } else {
      fetchStudentId();
      // ensure no stale preview when adding new
      setProfilePhotoPreview(null);
      setProfilePhoto(null);
    }
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => {
      // cleanup created object URL
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  const loadStudent = async () => {
    try {
      const { data } = await api.get(`/admin/students/${id}`);

      setStudentId(data.studentId);

      const formatDateForInput = (isoDate) => {
        if (!isoDate) return "";
        // if passed already in DD/MM/YYYY, return it
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) return isoDate;
        const dateObj = new Date(isoDate);
        if (isNaN(dateObj.getTime())) return "";
        const d = String(dateObj.getDate()).padStart(2, "0");
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`; // form expects DD/MM/YYYY
      };

      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        course: data.course?._id || "",
        dob: formatDateForInput(data.dob),
        gender: data.gender || "male",
        paymentStatus: data.paymentStatus || "demo",
        aadharNumber: data.aadharNumber || "",
      });

      // set existing avatar preview (so user sees current photo). Do not convert to File.
      if (data.avatar) {
        setProfilePhotoPreview(data.avatar);
      } else {
        setProfilePhotoPreview(null);
      }
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

    // PHONE: always keep only digits and max 10
    if (name === "phone") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: onlyDigits }));
      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
      return;
    }

    // DOB formatting — DD/MM/YYYY with cursor preservation
    if (name === "dob") {
      const cursor = selectionStart ?? value.length;
      const prev = formData.dob ?? "";
      const prevDigits = prev.replace(/\D/g, "");
      const newDigits = value.replace(/\D/g, "").slice(0, 8); // allow up to DDMMYYYY

      // Build formatted string
      let formatted = "";
      for (let i = 0; i < newDigits.length; i++) {
        if (i === 2) formatted += "/";
        if (i === 4) formatted += "/";
        formatted += newDigits[i];
      }

      // Calculate cursor position more reliably:
      // Count number of slashes before the original cursor and after formatting
      const beforeCursorDigits = value.slice(0, cursor).replace(/\D/g, "")
        .length;
      let newCursor = beforeCursorDigits;
      // add slash offsets
      if (beforeCursorDigits > 2) newCursor += 1;
      if (beforeCursorDigits > 4) newCursor += 1;
      // ensure within bounds
      newCursor = Math.max(0, Math.min(formatted.length, newCursor));

      setFormData((prevState) => ({ ...prevState, dob: formatted }));

      // Restore cursor after React updates
      setTimeout(() => {
        try {
          if (document.activeElement && document.activeElement.name === "dob") {
            document.activeElement.setSelectionRange(newCursor, newCursor);
          }
        } catch (err) {
          // ignore selection errors on some browsers
        }
      }, 0);

      if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
      return;
    }

    // For select components that pass event-like value as string (FormSelect may do e.target.value or direct value),
    // the existing pattern uses e.target - keep the same behaviour:
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
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profilePhoto: "File must be below 5MB",
      }));
      return;
    }

    // revoke previous object URL
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }

    if (file) {
      const objUrl = URL.createObjectURL(file);
      lastObjectUrlRef.current = objUrl;
      setProfilePhotoPreview(objUrl);
      setProfilePhoto(file);
    } else {
      // if user cleared file input
      setProfilePhoto(null);
      // keep existing preview if editing; otherwise clear
      if (!isEdit) setProfilePhotoPreview(null);
    }

    // clear any file error
    if (errors.profilePhoto) setErrors((prev) => ({ ...prev, profilePhoto: "" }));
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

    if (!String(formData.course).trim()) newErrors.course = "Course is required";

    // DOB Validation
    if (!formData.dob.trim()) {
      newErrors.dob = "DOB is required";
    } else {
      const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
      if (!regex.test(formData.dob)) newErrors.dob = "Use DD/MM/YYYY format";
    }

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
      .map((w) => w[0] || "")
      .join("")
      .slice(0, 4);

    const parts = (formData.dob || "").split("/");
    const year = parts.length >= 3 ? parts[2] : "0000";
    return `${initials}${year}`;
  };

  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length !== 3) return dateStr;
    const [d, m, y] = parts;
    // return YYYY-MM-DD (safe ISO-like)
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
      submitData.append("aadharNumber", formData.aadharNumber || "");

      // If user selected a new File, append it. If editing and no new file, we don't append (backend should keep existing).
      if (profilePhoto instanceof File) {
        submitData.append("profilePhoto", profilePhoto);
      }

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
    // if adding new, clear preview; if editing, keep existing preview from server
    if (!isEdit) setProfilePhotoPreview(null);
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
                // optional: pattern to hint mobile validation
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
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
              placeholder="Enter 12-digit Aadhar (Optional)"
              error={errors.aadharNumber}
              icon={HiIdentification}
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
                // pass preview URL to FileUpload if it supports preview prop
                previewUrl={profilePhotoPreview}
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
