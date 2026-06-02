import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
// ✅ Import the background image (same as in App.jsx)
import bgImage from '../../assets/bg.png';

export default function LoginPanel() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-5"
      style={{
        backgroundImage: `url(${bgImage})`, // ✅ Use imported variable
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Rest of the JSX remains exactly the same */}
      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">EN</span>
          </div>
          <h1 className="text-2xl font-bold text-purple-900">بانک اقتصاد نوین</h1>
          <p className="text-purple-600 text-sm mt-2">دستیار هوشمند مالی</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-purple-800 text-sm font-medium mb-2 text-right">
              نام کاربری
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 transition text-right"
              placeholder="نام کاربری خود را وارد کنید"
              required
            />
          </div>

          <div>
            <label className="block text-purple-800 text-sm font-medium mb-2 text-right">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 transition text-right"
              placeholder="رمز عبور خود را وارد کنید"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-800 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال ورود...' : 'ورود به پنل'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-purple-500">
          کاربر پیش‌فرض: {username || 'amin'} | رمز: 123
        </div>
      </div>
    </div>
  );
}