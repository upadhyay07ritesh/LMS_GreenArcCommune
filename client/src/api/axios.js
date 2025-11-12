// src/api/axios.js
import axios from "axios";
import { toast } from "react-toastify";

// ✅ Base URL configuration
const baseURL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000/api"  // Using localhost for development
    : "https://lms-greenarccommune-2.onrender.com/api";

// Host for static assets (e.g., /uploads), derived from API base by removing trailing /api
export const assetBaseURL = baseURL.replace(/\/api$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true, // Ensures cookies are sent with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Configure CSRF protection if needed
api.defaults.xsrfCookieName = 'csrftoken';
api.defaults.xsrfHeaderName = 'X-CSRFToken';

// ✅ Request Interceptor
api.interceptors.request.use(
  (config) => {
    // For API routes that don't require CSRF protection
    if (config.url && config.url.startsWith('/api/')) {
      config.xsrfCookieName = undefined;
      config.xsrfHeaderName = undefined;
    }
    
    // Log request for debugging
    console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.debug(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const reqUrl = error.config?.url || "";
    const errorMessage = error.response?.data?.message || error.message;

    // Log error for debugging
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: status || 'No Status',
      message: errorMessage,
      data: error.response?.data
    });

    // Don't retry requests that have already been retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle specific status codes
    switch (status) {
      case 400: // Bad Request
        toast.error(errorMessage || 'Invalid request. Please check your input.');
        break;
        
      case 401: // Unauthorized
        // Skip for auth routes to prevent infinite loops
        if (!reqUrl.includes('/auth/')) {
          // Clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            const message = errorMessage === 'Token expired' 
              ? 'Your session has expired. Please log in again.'
              : 'Please log in to continue.';
            toast.warn(message);
            window.location.href = '/login';
          }
        }
        break;
        
      case 403: // Forbidden
        toast.warn(errorMessage || 'You do not have permission to perform this action.');
        break;
        
      case 404: // Not Found
        toast.error(errorMessage || 'The requested resource was not found.');
        break;
        
      case 422: // Unprocessable Entity (validation errors)
        // Handle validation errors (you might want to handle this in your components instead)
        console.error('Validation errors:', error.response?.data?.errors);
        break;
        
      case 429: // Too Many Requests
        toast.warn(errorMessage || 'Too many requests. Please try again later.');
        break;
        
      case 500: // Internal Server Error
        console.error('Server Error:', error.response?.data);
        toast.error(errorMessage || 'An unexpected error occurred. Please try again later.');
        break;
        
      default:
        // Handle network errors
        if (!status) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(errorMessage || 'An error occurred. Please try again.');
        }
    }

    return Promise.reject(error);
  }
);

export default api;
