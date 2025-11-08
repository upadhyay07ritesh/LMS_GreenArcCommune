// src/api/axios.js
import axios from "axios";
import { toast } from "react-toastify";

const baseURL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"
    : "https://lms-greenarccommune-2.onrender.com/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// ✅ Attach correct JWT token dynamically
api.interceptors.request.use((config) => {
  const role = localStorage.getItem("userRole");
  const tokenKey = role === "admin" ? "adminToken" : "token";
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ============================================================
   ⚙️ RESPONSE INTERCEPTOR — Bulletproof version
============================================================ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // ⚙️ Prevent false logout on server 500 or validation errors
    if (status === 401) {
      toast.error("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("userRole");
      setTimeout(() => {
        // Use replace to avoid creating a back-button trap
        window.location.replace("/login");
      }, 1500);
    } else if (status === 403) {
      toast.warn("Access denied. Admin privileges required.");
    } else if (status === 500) {
      console.error("💥 Server Error:", error.response?.data);
      toast.error("Internal Server Error — please try again later.");
      // ❌ DO NOT logout here!
    } else if (!status) {
      toast.error("Network error or server unreachable.");
    }

    return Promise.reject(error);
  }
);


export default api;
