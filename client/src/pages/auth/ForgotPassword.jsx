import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../api/axios.js";
import { toast } from "react-toastify";
import { HiArrowLeft, HiLockClosed } from "react-icons/hi2";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP, 3: reset password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false); // only for request and reset
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const [resetToken, setResetToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = (seconds = 30) => {
    setResendTimer(seconds);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Please enter a valid email");

    setLoading(true);
    try {
      await api.post("/auth/forgot-password/request-otp", { email });
      toast.success("OTP sent to your email");
      setStep(2);
      startResendTimer();
    } catch (error) {
      const message = error.response?.data?.message;
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter || 60;
        setResendTimer(retryAfter);
        toast.error(`Please wait ${retryAfter}s before requesting another OTP`);
      } else {
        toast.error(message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setVerifying(true);
    try {
      const response = await api.post("/auth/forgot-password/verify-otp", {
        email,
        otp,
      });
      setResetToken(response.data.resetToken);
      toast.success("OTP verified successfully");
      setStep(3);
    } catch (error) {
      const message = error.response?.data?.message;
      toast.error(message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || resending) return;
    if (!email) {
      toast.error("Email missing. Please go back and enter your email again.");
      return;
    }

    setResending(true);
    try {
      const res = await api.post("/auth/forgot-password/request-otp", { email });
      toast.success(res.data?.message || "OTP resent successfully!");
      startResendTimer(30);
    } catch (error) {
      const message = error.response?.data?.message;
      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter || 60;
        startResendTimer(retryAfter);
        toast.error(`Please wait ${retryAfter}s before resending OTP`);
      } else {
        toast.error(message || "Failed to resend OTP");
        startResendTimer(30);
      }
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      await api.post("/auth/forgot-password/reset", {
        resetToken,
        newPassword,
      });
      toast.success("Password reset successful! Please login.");
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-slate-900 dark:to-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
            <HiLockClosed className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Enter OTP"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {step === 1 && "Enter your email to receive a reset code"}
            {step === 2 && "Check your email for the OTP"}
            {step === 3 && "Enter your new password"}
          </p>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <label className="label">OTP Code</label>
            <input
              className="input text-center text-2xl tracking-widest font-mono"
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              required
              maxLength={6}
              placeholder="000000"
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : "Didn't get the code?"}
              </p>

              <button
                type="button"
                onClick={handleResendOTP}
                className={`btn btn-outline text-sm sm:text-base ${
                  resendTimer > 0 || resending
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={resendTimer > 0 || resending}
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-outline flex-1"
              >
                <HiArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <label className="label">New Password</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-outline flex-1"
              >
                <HiArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
