import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { logout } from "../slices/authSlice.js";
import DarkModeToggle from "../components/DarkModeToggle.jsx";
import NotificationBanner from "../components/NotificationBanner.jsx";
import AdminMessages from "../pages/admin/AdminMessages.jsx";
import { motion } from "framer-motion";

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
  HiChevronRight,
  HiUser,
} from "react-icons/hi2";
import { useState } from "react";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // ✅ Auto-select Dashboard as default active tab
  useEffect(() => {
    if (
      window.location.pathname === "/admin" ||
      window.location.pathname === "/admin/"
    ) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

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
  const breadcrumbIcons = {
    Dashboard: HiHome,
    Students: HiUsers,
    Courses: HiBookOpen,
    Analytics: HiChartBar,
    "Live Sessions": HiLink,
    "Manage Admins": HiShieldCheck,
    Profile: HiUser,
  };
  const generateBreadcrumbs = () => {
    const fullPath = window.location.pathname.replace("/admin", "");
    if (!fullPath || fullPath === "/") return ["Dashboard"];

    const segments = fullPath.split("/").filter(Boolean);

    return [
      "Dashboard",
      ...segments.map((seg) =>
        seg.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      ),
    ];
  };

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
                  <DarkModeToggle />
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

        {/* Sidebar Footer (Fixed & Optimized) */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4 flex flex-col gap-3">
          {/* Profile Card */}
          <div
            onClick={() => navigate("/admin/profile")}
            className="
      group relative flex items-center justify-between cursor-pointer
      p-3 rounded-xl 
      bg-white/60 dark:bg-slate-800/60 
      border border-slate-200 dark:border-slate-700 
      hover:bg-white/90 dark:hover:bg-slate-800/90
      backdrop-blur-xl shadow-sm hover:shadow-md
      transition-all duration-300
    "
          >
            {/* Tooltip */}
            <div
              className="
        absolute -top-12 left-1/2 -translate-x-1/2
        opacity-0 group-hover:opacity-100
        translate-y-2 group-hover:translate-y-0
        transition-all duration-300 
        bg-primary-100 dark:bg-primary-900/50
        text-primary-700 dark:text-primary-300
        text-[11px] px-2 py-1 rounded-md shadow 
      "
            >
              View Profile
              {/* Tooltip Arrow */}
              <div
                className="
          absolute -bottom-1 left-1/2 -translate-x-1/2 
          w-2 h-2 bg-primary-100 dark:bg-primary-900/50 
          rotate-45
        "
              ></div>
            </div>

            {/* Sidebar collapsed view → Avatar only */}
            {collapsed ? (
              <div className="flex justify-center w-full">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="w-10 h-10 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div
                    className="
              w-10 h-10 rounded-full flex items-center justify-center
              bg-gradient-to-br from-primary-400 to-primary-600
              text-white font-semibold text-sm shadow-sm
            "
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                )}
              </div>
            ) : (
              /* Expanded view */
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    className="
              w-10 h-10 rounded-full object-cover 
              ring-2 ring-transparent group-hover:ring-primary-400
              transition-all duration-300 shadow-sm
            "
                  />
                ) : (
                  <div
                    className="
              w-10 h-10 rounded-full flex items-center justify-center
              bg-gradient-to-br from-primary-400 to-primary-600
              text-white font-semibold text-sm shadow-sm
              group-hover:scale-[1.05] transition-transform
            "
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                )}

                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary-500 transition">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.role || "Admin"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-lg 
      text-red-600 dark:text-red-400 
      hover:bg-red-50 dark:hover:bg-red-900/20 
      transition-colors
      ${collapsed ? "justify-center" : ""}
    `}
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
          {/* ===== Enhanced Breadcrumbs ===== */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mb-6 flex items-center gap-2 text-sm"
          >
            {generateBreadcrumbs().map((crumb, idx, arr) => {
              const isLast = idx === arr.length - 1;
              const Icon = breadcrumbIcons[crumb] || HiChevronRight;

              return (
                <div key={idx} className="flex items-center gap-2">
                  {/* Crumb */}
                  <div
                    onClick={() => {
                      if (!isLast) {
                        const path =
                          "/admin/" +
                          arr
                            .slice(1, idx + 1)
                            .join("/")
                            .toLowerCase()
                            .replace(/\s+/g, "-");
                        navigate(path);
                      }
                    }}
                    className={`
            px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer 
            transition-all duration-200
            ${
              isLast
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/30"
            }
          `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{crumb}</span>
                  </div>

                  {/* Separator */}
                  {!isLast && (
                    <HiChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
              );
            })}
          </motion.div>

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
