import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chat_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('chat_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // ✅ Look for access_token instead of token
      const { access_token } = response.data;
      
      if (!access_token) {
        throw new Error('Invalid credentials');
      }

      // ✅ Create a temporary user object since the backend doesn't send one
      const userData = { username: username, displayName: username };

      localStorage.setItem('chat_token', access_token);
      localStorage.setItem('chat_user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token // This will now correctly evaluate to true
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}