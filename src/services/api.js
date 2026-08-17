import axios from 'axios';

/**
 * 1) VITE_API_URL if set
 * 2) Vite dev port 5173 → http://localhost:8000
 * 3) else same origin (nginx https://localhost)
 */
function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location) {
    const { port, origin, protocol, hostname } = window.location;
    if (port === '5173' || port === '5174') {
      return `${protocol}//${hostname}:8000`;
    }
    return origin;
  }
  return 'http://localhost:8000';
}

const api = axios.create({
  baseURL: resolveApiBase(),
  timeout: 120000,
});

function getStoredToken() {
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