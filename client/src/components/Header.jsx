import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DarkModeToggle from "../components/DarkModeToggle.jsx";
import Avatar from "../components/ui/Avatar.jsx";

export default function Header({ navItems, user, handleLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // 🧭 Detect scroll for compact/floating effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={scrolled ? { y: 0, scale: 0.98 } : { y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 
        ${
          scrolled
            ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-green-200/50 dark:border-green-800/50 shadow-lg shadow-green-100/20 dark:shadow-green-900/20"
            : "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500">
        {/* ==== HEADER FLEX ==== */}
        <div
          className={`flex items-center justify-between h-16 ${
            scrolled ? "py-1" : "py-2"
          } transition-all duration-300`}
        >
          {/* 🌿 Logo Section */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer flex-shrink-0"
            whileHover={{ scale: 1.03 }}
            onClick={() => {
              if (user?.role === "student") navigate("/student/");
              else if (user?.role === "admin") navigate("/admin/");
              else navigate("/");
            }}
          >
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

            <div className="hidden sm:block leading-tight">
              <h1 className="text-lg sm:text-xl font-bold text-green-800 dark:text-green-100 font-display tracking-tight">
                Green Arc Commune
              </h1>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Learning Platform
              </p>
            </div>
          </motion.div>

          {/* 🧭 Center Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-3 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/student"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? "bg-green-100/70 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm border border-green-200/40 dark:border-green-700/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* 👤 Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* 🌗 Dark Mode */}
            <DarkModeToggle />

            {/* 💻 User Info (Desktop) */}
            <div
              onClick={() => navigate("/student/profile")}
              className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-green-50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
            >
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>
              <Avatar
                src={user?.avatar}
                fallback={user?.name}
                size="md"
                className="ring-2 ring-green-500/40"
              />
            </div>

            {/* 📱 Mobile Avatar */}
            <div
              onClick={() => navigate("/student/profile")}
              className="md:hidden flex items-center gap-2 cursor-pointer hover:bg-green-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-all"
            >
              <Avatar
                src={user?.avatar}
                fallback={user?.name}
                size="sm"
                className="ring-2 ring-green-500/40"
              />
              <div className="flex flex-col text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✨ Bottom Glow Line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent"></div>
    </motion.header>
  );
}
