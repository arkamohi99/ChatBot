import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
});

function getStoredToken() {
  // support both keys used across the app
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('chat_token') ||
    localStorage.getItem('access_token') ||
    null
  );
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;