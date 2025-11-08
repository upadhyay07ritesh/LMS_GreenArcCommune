import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import DarkModeToggle from "../components/DarkModeToggle.jsx";
import NotificationBanner from "../components/NotificationBanner.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import {
  HiHome,
  HiBookOpen,
  HiArrowRightOnRectangle,
  HiBars3,
  HiXMark,
  HiBell,
} from "react-icons/hi2";
import { useEffect, useState } from "react";
import { logout } from "../slices/authSlice.js";

export default function StudentLayout() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    { path: "/student", label: "Dashboard", icon: HiHome },
    { path: "/student/courses", label: "Courses", icon: HiBookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors overflow-x-hidden">
      <NotificationBanner />

      {/* Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg shadow-lg border-b border-slate-200 dark:border-slate-700"
            : "bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-28 h-10 flex items-center justify-center shadow-lg">
                {/* Light Mode Logo */}
                <img
                  src="/GreenArcLogo.png"
                  alt="GreenArc Logo"
                  className="block dark:hidden w-full h-auto transition-opacity duration-300"
                />

                {/* Dark Mode (White) Logo */}
                <img
                  src="/WhiteLogo.png"
                  alt="GreenArc White Logo"
                  className="hidden dark:block w-full h-auto transition-opacity duration-300"
                />
              </div>

              <div className="hidden sm:block">
                <h1 className="text-xl font-display font-bold text-green-900 dark:text-white">
                  Green Arc Commune's
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Learning Platform
                </p>
              </div>
            </motion.div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/student"}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                        isActive
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <HiBell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <DarkModeToggle />

              <div
                onClick={() => navigate("/student/profile")}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </p>
                </div>
                <Avatar src={user?.avatar} fallback={user?.name} size="md" />
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {mobileMenuOpen ? (
                  <HiXMark className="w-6 h-6" />
                ) : (
                  <HiBars3 className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <nav className="px-4 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/student"}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                          isActive
                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <Avatar fallback={user?.name} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                  >
                    <HiArrowRightOnRectangle className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
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
    </div>
  );
}
