import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import StudentDashboard from './pages/student/Dashboard.jsx'
import StudentProfile from './pages/student/Profile.jsx'
import StudentCourses from './pages/student/Courses.jsx'
import CourseDetail from './pages/student/CourseDetail.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import ManageCourses from './pages/admin/ManageCourses.jsx'
import ManageStudents from './pages/admin/ManageStudents.jsx'
import Analytics from './pages/admin/Analytics.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import StudentLayout from './layouts/StudentLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}> 
        <Route element={<StudentLayout />}> 
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/courses" element={<StudentCourses />} />
          <Route path="/student/courses/:id" element={<CourseDetail />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}> 
        <Route element={<AdminLayout />}> 
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<ManageCourses />} />
          <Route path="/admin/students" element={<ManageStudents />} />
          <Route path="/admin/analytics" element={<Analytics />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
