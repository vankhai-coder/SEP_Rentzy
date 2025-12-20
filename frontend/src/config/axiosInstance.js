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
// axiosInstance.interceptors.request.use(
//   (config) => {
//     console.log('Making request to:', config.baseURL + config.url);
//     return config;
//   },
//   (error) => {
//     console.error('Request error:', error);
//     return Promise.reject(error);
//   }
// );

// Thêm response interceptor để log responses
// axiosInstance.interceptors.response.use(
//   (response) => {
//     console.log('Response received:', response.status, response.data);
//     return response;
//   },
//   (error) => {
//     // Log tổng quan lỗi
//     console.error('Response error:', error);
//     // Log chi tiết status/data từ backend nếu có
//     if (error.response) {
//       console.error('Response error status:', error.response.status);
//       console.error('Response error data:', error.response.data);
//       console.error('Response error headers:', error.response.headers);
//     }
//     // Log lỗi timeout riêng
//     if (error.code === 'ECONNABORTED') {
//       console.error('Request timeout - server took too long to respond');
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;
