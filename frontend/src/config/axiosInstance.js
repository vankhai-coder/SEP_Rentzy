import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    // "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies with every request
});

// Thêm request interceptor để log requests
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Thêm response interceptor để log responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server took too long to respond');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
