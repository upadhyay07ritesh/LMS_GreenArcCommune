// client/src/api/axios.js
import axios from "axios";

const baseURL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"
    : "https://lms-greenarccommune-1.onrender.com/api";

// Host for static assets (e.g., /uploads), derived from API base by removing trailing /api
export const assetBaseURL = baseURL.replace(/\/api$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true, // Important for sending cookies
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
); // <-- ✅ missing parenthesis fixed

// ✅ Response interceptor to handle token refresh or redirect on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear invalid tokens and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
