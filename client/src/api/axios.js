// src/api/axios.js
import axios from "axios";
import { toast } from "react-toastify";

// ✅ Base URL configuration
const baseURL =
  import.meta.env.MODE === "development"
    ? "http://192.168.1.74:5000/api"
    : "https://lms-greenarccommune-2.onrender.com/api";

// Host for static assets (e.g., /uploads), derived from API base by removing trailing /api
export const assetBaseURL = baseURL.replace(/\/api$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true, // ensures cookies/JWT across subdomains
});

// ✅ Request Interceptor: Attach auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor: Handle token refresh and auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const reqUrl = error.config?.url || "";

    // Don't retry requests that have already been retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized responses
    if (status === 401) {
      // Skip for login/signup routes to prevent infinite loops
      if (reqUrl.includes('/auth/')) {
        return Promise.reject(error);
      }

      // Don't log out for these cases
      const shouldNotLogout = [
        '/auth/me',
        '/student/profile',
        '/manage-admins/admins'
      ].some(route => reqUrl.includes(route));

      if (!shouldNotLogout) {
        // Clear auth data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        
        // Only show toast if not already on login page
        if (!window.location.pathname.includes('/login')) {
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (status === 403) {
      toast.warn('You do not have permission to perform this action.');
    }
    
    // Handle 500 Server Error
    if (status === 500) {
      console.error('Server Error:', error.response?.data);
      toast.error('An unexpected error occurred. Please try again later.');
    }

    // Handle network errors
    if (!status) {
      toast.error('Network error. Please check your connection and try again.');
    }

    return Promise.reject(error);
  }
);

export default api;
