// src/api/axios.js
import axios from "axios";
import { toast } from "react-toastify";

// ✅ Base URL configuration
const baseURL =
  import.meta.env.MODE === "development"
    ? "http://192.168.1.66:5000/api"
    : "https://lms-greenarccommune-2.onrender.com/api";

const api = axios.create({
  baseURL,
  withCredentials: true, // ensures cookies/JWT across subdomains
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
   ⚙️ RESPONSE INTERCEPTOR — Fixed and Safe Version
============================================================ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const reqUrl = error?.config?.url || "";

    // ✅ Handle common cases safely
    if (status === 401 && !reqUrl.includes("/auth/me") && !reqUrl.includes("/student/profile")) {
      toast.error("Your session has expired. Please log in again.");
      localStorage.clear();
      window.location.href = "/login";
    } else if (status === 403) {
      toast.warn("Access denied. Admin privileges required.");
    } else if (status === 500) {
      console.error("💥 Server Error:", error.response?.data);
      toast.error("Internal Server Error — please try again later.");
    } else if (!status) {
      toast.error("Network error or server unreachable.");
    }

    return Promise.reject(error);
  }
);

export default api;
