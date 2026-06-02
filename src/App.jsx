import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import bgImage from './assets/bg.png';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Log for debugging
  useEffect(() => {
    console.log('App mounted, base URL:', import.meta.env.BASE_URL);
    console.log('Current path:', window.location.pathname);
  }, []);

  // IMPORTANT: Set basename to match Vite's base config
  const basename = import.meta.env.BASE_URL || '/';

  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div 
                  className="min-h-screen font-vazirmatn" 
                  dir="rtl"
                  style={{
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed'
                  }}
                >
                  <div className="min-h-screen p-5">
                    <div className="max-w-[1420px] mx-auto">
                      <div className="flex gap-5 h-[calc(100vh-40px)]">
                        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                        <div className="flex-1 h-full">
                          <Routes>
                            <Route path="/" element={<ChatPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                          </Routes>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}