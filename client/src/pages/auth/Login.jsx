import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk } from "../../slices/authSlice.js";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, useReducedMotion } from "framer-motion";
import { HiEye, HiEyeSlash } from "react-icons/hi2";
import logo from "/GreenArcLogo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { loading } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const onSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password)
      return toast.error("Enter email & password");

    const res = await dispatch(loginThunk({ email: trimmedEmail, password }));
    if (res.meta.requestStatus === "fulfilled") {
      const user = res.payload.user;
      toast.success(`Welcome back, ${user.name || "User"}!`);
      if (user.role === "admin") navigate("/admin/");
      else if (user.role === "student") navigate("/student?wb=1");
      else navigate("/");
    } else {
      toast.error(res.payload?.message || "Login failed.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 
      bg-gradient-to-br from-green-50 to-green-100 dark:from-[#002015] dark:to-[#032015]"
    >
      {/* ---------- OUTER PREMIUM RECTANGLE ---------- */}
      <div
        className="w-full max-w-6xl h-auto lg:h-[600px]
        bg-white dark:bg-green-950/60 backdrop-blur-xl
        rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] overflow-hidden
        border border-green-200 dark:border-green-800 flex flex-col lg:flex-row"
      >
        {/* ---------- LEFT FOREX WAVES SECTION ---------- */}
        <aside
          className="hidden lg:flex w-1/2 relative items-center justify-center 
  bg-gradient-to-br from-green-300 via-green-400 to-green-500 overflow-hidden"
        >
          {/* Soft glow */}
          <motion.div
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.12, 1] }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute top-6 left-12 w-[460px] h-[460px] bg-green-200/40 rounded-full blur-3xl"
          />

          {/* ---------- OLD WAVES (your earlier ones) but LOWERED ---------- */}
          <motion.svg
            className="absolute opacity-70 translate-y-24" // ↓↓↓ waves moved DOWN
            width="600"
            height="350"
            viewBox="0 0 600 350"
            fill="none"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <path
              d="M0 200 C100 120, 180 260, 300 180 C420 100, 500 260, 600 160"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-70"
            />
            <path
              d="M0 240 C120 160, 220 300, 340 200 C440 140, 520 260, 600 200"
              stroke="#d1fae5"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-70"
            />
            <path
              d="M0 280 C130 200, 260 320, 380 240 C500 180, 580 300, 600 260"
              stroke="#ecfdf5"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-80"
            />
          </motion.svg>

          {/* ---------- Logo + Tagline (logo moved upward slightly) ---------- */}
          <div className="relative z-20 flex flex-col items-center -mt-20">
            {" "}
            {/*  logo moved UP */}
            <motion.img
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1 }}
              src={logo}
              alt="Green Arc Commune"
              className="w-[310px] drop-shadow-2xl mb-4"
            />
            {/* Luxury Professional Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-white text-2xl font-medium tracking-[0.15em] drop-shadow-lg"
              style={{
                fontFamily: "Georgia, serif",
                letterSpacing: "0.12em",
                textShadow: "0px 2px 12px rgba(0,0,0,0.35)",
              }}
            >
              Wealth • Wisdom • Wellness
            </motion.p>
          </div>

          {/* Floating highlight */}
          <motion.div
            animate={{ y: [0, -12, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute right-16 bottom-16 w-40 h-40 bg-white/40 rounded-full blur-2xl"
          />
        </aside>

        {/* ---------- RIGHT LOGIN FORM SECTION ---------- */}
        {/* RIGHT FORM SECTION */}
        <main className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-6 text-center">
              <img src={logo} alt="Logo" className="mx-auto w-32" />
            </div>

            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/90 dark:bg-green-900/40 
              backdrop-blur-md border border-green-200 dark:border-green-700
              rounded-2xl shadow-xl px-6 py-8"
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold text-green-900 dark:text-green-100">
                  Welcome Back
                </h2>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Securely sign in to continue learning
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-green-900 dark:text-green-200">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abc@gmail.com"
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white border border-green-300
                    dark:bg-green-950/50 dark:border-green-700 focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-green-900 dark:text-green-200">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-green-300
                      dark:bg-green-950/50 dark:border-green-700 focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-300"
                    >
                      {showPassword ? <HiEyeSlash /> : <HiEye />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    className="text-green-600 hover:underline"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>

                  <span className="text-green-700 dark:text-green-300">
                    <span className="text-black dark:text-white">Need help?</span>
                    {" "}
                    <a
                      href="https://wa.me/+919753574157"
                      target="_blank"
                      className="underline"
                    >
                      Support
                    </a>
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 
                  text-white font-semibold rounded-xl shadow-lg hover:shadow-xl"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </motion.button>
              </form>

              <div className="mt-6 text-center text-sm text-green-700 dark:text-green-300">
                <span className="text-black dark:text-white">Don’t have an account? </span>
                <a
                  href="https://wa.me/+919753574157"
                  target="_blank"
                  className="underline ml-1"
                >
                  Contact Support
                </a>
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}
