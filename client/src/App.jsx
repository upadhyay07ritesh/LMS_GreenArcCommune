import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentProfile from "./pages/student/Profile.jsx";
import StudentCourses from "./pages/student/Courses.jsx";
import CourseDetail from "./pages/student/CourseDetail.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import ManageCourses from "./pages/admin/ManageCourses.jsx";
import ManageStudents from "./pages/admin/ManageStudents.jsx";
import AddStudent from "./pages/admin/AddStudent.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import AddAdmin from "./pages/admin/AddAdmin.jsx";
import ChangePassword from "./pages/admin/ChangePassword.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import StudentLayout from "./layouts/StudentLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import CourseLiveSessions from "./pages/admin/CourseLiveSessions.jsx";
import StudentDetail from "./pages/admin/StudentDetail.jsx";
import ManageAdmins from "./pages/admin/ManageAdmins.jsx";
import AdminDetail from "./pages/admin/AdminDetail.jsx";
// import ScreenProtector from './components/ScreenProtector.jsx'

export default function App() {
  return (
    <>
      {/* <ScreenProtector /> */}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route
              path="/student/change-password"
              element={<ChangePassword />}
            />
            <Route path="/student/courses" element={<StudentCourses />} />
            <Route path="/student/courses/:id" element={<CourseDetail />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/add-admin" element={<AddAdmin />} />
            <Route path="/admin/manage-admins" element={<ManageAdmins />} />
            <Route path="admin/:id" element={<AdminDetail />} />
            <Route path="/admin/profile" element={<StudentProfile />} />
            <Route path="/admin/change-password" element={<ChangePassword />} />
            <Route path="/admin/courses" element={<ManageCourses />} />
            <Route path="/admin/students" element={<ManageStudents />} />
            <Route path="/admin/add-student" element={<AddStudent />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route
              path="/admin/course-live-sessions"
              element={<CourseLiveSessions />}
            />
            <Route path="/admin/student/:id" element={<StudentDetail />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}
