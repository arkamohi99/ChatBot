// App.jsx - Light background with subtle purple gradient
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-purple-300 font-vazirmatn" dir="rtl">
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
    </Router>
  );
}