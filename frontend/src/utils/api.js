const getApiUrl = () => {
  // If in production on Vercel, we can make api requests to the same origin (relative paths)
  if (import.meta.env.PROD) {
    return '/api';
  }
  // Local development
  return 'http://localhost:5000/api';
};

import axios from 'axios';

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { getApiUrl };
