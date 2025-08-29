import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api", // backend URL
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Attach token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data, // always return `data`
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.data.message || error.response.statusText);
    } else {
      console.error("Network Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
