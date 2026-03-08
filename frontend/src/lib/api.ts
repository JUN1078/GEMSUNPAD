import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api', timeout: 30000 });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('hse_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hse_token');
      localStorage.removeItem('hse_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
