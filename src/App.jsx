import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-[#140a2a] font-vazirmatn" dir="rtl">
        <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(160,120,255,0.55),transparent),radial-gradient(900px_500px_at_85%_40%,rgba(120,86,214,0.55),transparent),linear-gradient(135deg,#2a1658,#45207f_45%,#7b4bd6)] p-5">
          
          <div className="max-w-[1420px] mx-auto">
            <div className="flex gap-5 h-[calc(100vh-40px)]">
              
              <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
              />

              <div className="flex-1">
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