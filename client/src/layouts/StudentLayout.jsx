import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBanner from "../components/NotificationBanner.jsx";
import MessagesSidebar from "../pages/student/MessagesSidebar.jsx";
import {
  HiHome,
  HiBookOpen,
  HiUser,
  HiVideoCamera,
  HiArchiveBox,
  HiRss,
  HiEnvelope,
  HiDocument,
} from "react-icons/hi2";
import { useEffect, useState } from "react";
import { logout } from "../slices/authSlice.js";
import Header from "../components/Header.jsx";

export default function StudentLayout() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navItems = [
    { path: "/student/", label: "Home", icon: HiHome },
    { path: "/student/courses", label: "Courses", icon: HiBookOpen },
    { path: "/student/live-sessions", label: "Live", icon: HiVideoCamera },
    { path: "/student/journal", label: "Journal", icon: HiDocument },
    { path: "/student/profile", label: "Profile", icon: HiUser },
  ];
  const handleNav = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors overflow-x-hidden">
      <NotificationBanner />

      {/* Navbar */}
      <Header navItems={navItems} user={user} handleLogout={handleLogout} />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
        <MessagesSidebar />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <HiBookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  GreenArc Commune LMS
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Empowering learners worldwide
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2025 GreenArc Commune. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 
                       backdrop-blur-lg bg-white/90 dark:bg-slate-900/90
                       border-t border-slate-200 dark:border-slate-700 
                       flex justify-around items-center py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
                       transition-all duration-300"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => handleNav(item.path)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 250, damping: 15 }}
              className={`relative flex flex-col items-center justify-center text-xs font-medium px-3 py-1.5 rounded-xl 
                    ${
                      active
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400"
                    }`}
            >
              {/* Icon Animation */}
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  y: active ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="relative flex flex-col items-center"
              >
                <Icon className="w-6 h-6 mb-1 transition-transform" />

                {active && (
                  <motion.span
                    layoutId="active-glow"
                    className="absolute inset-0 rounded-full bg-primary-500/20 blur-md -z-10"
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`transition-all ${
                  active
                    ? "font-semibold text-primary-600 dark:text-primary-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>

              {/* Sliding underline */}
              {active && (
                <motion.div
                  layoutId="active-underline"
                  className="absolute bottom-0 w-8 h-[3px] bg-primary-500 rounded-full"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
}
