import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  HiTrash,
  HiUserGroup,
  HiCreditCard,
  HiPencil,
} from "react-icons/hi2";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [student, setStudent] = useState({
    _id: "",
    name: "",
    email: "",
    phone: "",
    studentId: "",
    course: { _id: "", name: "" },
    dob: "",
    aadharNumber: "",
    gender: "male",
    paymentStatus: "demo",
    status: "active",
    profilePhoto: "",
    createdAt: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    dob: "",
    aadharNumber: "",
    gender: "male",
    paymentStatus: "demo",
    status: "active",
  });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Format date from ISO to YYYY-MM-DD for date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  /* ===========================================================
     🔁 Load Student Data
  =========================================================== */
  const loadStudent = async () => {
    try {
      const { data } = await api.get(`/admin/students/${id}`);
      setStudent(data);

      // Set form data for editing
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        course: data.course?._id || "",
        dob: formatDateForInput(data.dob),
        aadharNumber: data.aadharNumber || "",
        gender: data.gender || "male",
        paymentStatus: data.paymentStatus || "demo",
        status: data.status || "active",
      });

      // Load courses for the course dropdown
      await loadCourses();
    } catch (error) {
      console.error("Failed to fetch student details:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const { data } = await api.get("/admin/courses");
      setCourses(data);
    } catch (error) {
      console.error("Failed to load courses:", error);
      toast.error("Failed to load courses");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email format";

    const phoneRegex = /^\d{10}$/;
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!phoneRegex.test(formData.phone))
      newErrors.phone = "Phone must be 10 digits";

    // Aadhar validation - required only for paid students
    if (formData.paymentStatus === "paid" && !formData.aadharNumber.trim()) {
      newErrors.aadharNumber = "Aadhar number is required for paid students";
    } else if (
      formData.aadharNumber &&
      !/^\d{12}$/.test(formData.aadharNumber)
    ) {
      newErrors.aadharNumber = "Aadhar must be 12 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append profile photo if changed
      if (profilePhoto) {
        formDataToSend.append("profilePhoto", profilePhoto);
      }

      const { data } = await api.put(`/admin/students/${id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStudent(data);
      setIsEditing(false);
      setProfilePhoto(null);
      toast.success("Student updated successfully");
    } catch (error) {
      console.error("Failed to update student:", error);
      toast.error(error.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to current student data
    setFormData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      course: student.course?._id || "",
      dob: formatDateForInput(student.dob),
      aadharNumber: student.aadharNumber || "",
      gender: student.gender || "male",
      paymentStatus: student.paymentStatus || "demo",
      status: student.status || "active",
    });
    setErrors({});
    setProfilePhoto(null);
  };

  useEffect(() => {
    loadStudent();
  }, [id]);

  /* ===========================================================
     🗑️ Delete Student Function
  =========================================================== */
  const deleteStudent = async () => {
    if (
      !confirm(`Are you sure you want to permanently delete ${student.name}?`)
    ) {
      return;
    }

    try {
      await api.delete(`/admin/students/${id}`);
      toast.success("Student deleted successfully!");
      navigate("/admin/students");
    } catch (error) {
      console.error("Failed to delete student:", error);
      toast.error("Failed to delete student. Please try again.");
    }
  };

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB"); // This will format as DD/MM/YYYY
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

        <div className="flex items-center gap-3">
          <Link
            to={`/admin/students/${id}`}
            state={{ from: "edit" }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors font-medium"
          >
            <HiPencil className="w-5 h-5" />
            Edit Student
          </Link>
          <button
            onClick={deleteStudent}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors font-medium"
          >
            <HiTrash className="w-5 h-5" />
            Delete Student
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start gap-6">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24">
            {student.profilePhoto ? (
              <img
                src={
                  student.profilePhoto?.startsWith("data:image")
                    ? student.profilePhoto
                    : `http://localhost:5000${student.profilePhoto}`
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
              <HiIdentification className="w-4 h-4 text-slate-400" />
              {student.studentId}
            </div>

            <div className="flex items-center gap-2">
              <HiCalendar className="w-4 h-4 text-slate-400" />
              {formatDate(student.dob)}
            </div>

            {student.aadharNumber && (
              <div className="flex items-center gap-2">
                <HiIdentification className="w-4 h-4 text-slate-400" />
                {student.aadharNumber}
              </div>
            )}

            <div className="flex items-center gap-2">
              <HiUserGroup className="w-4 h-4 text-slate-400" />
              {student.gender}
            </div>

            <div className="flex items-center gap-2">
              <HiCreditCard className="w-4 h-4 text-slate-400" />
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  student.paymentStatus === "paid"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                }`}
              >
                {student.paymentStatus}
              </span>
            </div>
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
                  <HiNoSymbol className="w-3.5 h-3.5" /> Inactive
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
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiIdentification className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Aadhar Number:</strong> {student.aadharNumber}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiUserGroup className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Gender:</strong> {student.gender}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <HiCreditCard className="w-5 h-5 text-slate-400" />
              <span>
                <strong>Payment Status:</strong> {student.paymentStatus}
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
