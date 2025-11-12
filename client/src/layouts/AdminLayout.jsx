import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice.js";
import DarkModeToggle from "../components/DarkModeToggle.jsx";
import NotificationBanner from "../components/NotificationBanner.jsx";
import AdminMessages from "../pages/admin/AdminMessages.jsx";
import {
  HiHome,
  HiBookOpen,
  HiUsers,
  HiChartBar,
  HiLink,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark,
  HiShieldCheck,
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
} from "react-icons/hi2";
import { useState } from "react";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: HiHome },
    { path: "/admin/courses", label: "Courses", icon: HiBookOpen },
    { path: "/admin/students", label: "Students", icon: HiUsers },
    { path: "/admin/analytics", label: "Analytics", icon: HiChartBar },
    {
      path: "/admin/course-live-sessions",
      label: "Live Sessions",
      icon: HiLink,
    },
    {
      path: "/admin/manage-admins",
      label: "Manage Admins",
      icon: HiShieldCheck,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* ===== Sidebar ===== */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 ${
          collapsed ? "w-16" : "w-64"
        } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
        flex flex-col justify-between transform transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Section */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-all duration-300">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              {/* When expanded → show logo with proper alignment */}
              {!collapsed && (
                <div className="flex items-center gap-3 group">
                  <div className="w-28 sm:w-28 h-10 flex items-center justify-center">
                    {/* Light Logo */}
                    <img
                      src="/GreenArcLogo.png"
                      alt="GreenArc Logo"
                      className="block dark:hidden w-full h-auto transition-all duration-300"
                    />
                    {/* Dark Logo */}
                    <img
                      src="/WhiteLogo.png"
                      alt="GreenArc White Logo"
                      className="hidden dark:block w-full h-auto transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              {/* When collapsed → show hamburger */}
              {collapsed && (
                <button
                  onClick={() => setCollapsed(false)}
                  className="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-700 transition-all duration-200"
                >
                  <HiBars3 className="w-6 h-6 text-primary-600 dark:text-primary-300" />
                </button>
              )}
            </div>

            {/* Collapse Toggle (only visible when expanded) */}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                title="Collapse Sidebar"
              >
                <HiChevronDoubleLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            )}

            {/* Close Button (Mobile) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              title="Close Sidebar"
            >
              <HiXMark className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} end>
                  {({ isActive }) => (
                    <div
                      className={`
              group flex items-center
              ${collapsed ? "justify-center px-0" : "gap-3 px-4"}
              py-3 rounded-lg transition-all duration-200 relative
              ${
                isActive
                  ? "bg-green-100 dark:bg-primary-900/30 text-green-700 dark:text-primary-300"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }
            `}
                      title={collapsed ? item.label : ""}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                          collapsed ? "group-hover:scale-110" : ""
                        }`}
                      />

                      {/* Label - show only when expanded */}
                      {!collapsed && (
                        <span className="whitespace-nowrap transition-all duration-200">
                          {item.label}
                        </span>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-md"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Sticky Bottom) */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            {!collapsed && (
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Admin
                </p>
              </div>
            )}
            <DarkModeToggle />
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <HiArrowRightOnRectangle className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 md:ml-${
          collapsed ? "20" : "0"
        }`}
      >
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <HiBars3 className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </button>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Admin Panel
          </h2>
          <DarkModeToggle />
        </header>

        {/* Notification Banner */}
        <NotificationBanner />

        {/* Main Page */}
        <main className="flex-1 px-4 sm:px-6 py-6 lg:py-10 transition-all">
          <Outlet />
          <AdminMessages />
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
          <div className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
            © 2025 GreenArc Commune LMS - Admin Portal
          </div>
        </footer>
      </div>
    </div>
  );
}
