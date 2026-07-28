import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { sidebarItems } from '../../data/sidebarItems';
import customLogo from '../../assets/logo_image.png';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const { items, unreadCount, markSeen, markAllSeen } = useRequests();
  const [showRequests, setShowRequests] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/login');
  };

  const goNewChat = () => {
    navigate('/');
  };

  if (!isOpen) {
    return (
      <div className="relative flex-shrink-0 w-0">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl
                     bg-purple-800 text-white text-sm shadow-lg hover:bg-purple-700 transition"
          title="باز کردن منو"
        >
          <span className="text-lg">☰</span>
          <span>منو</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="h-full flex flex-col overflow-hidden transition-all duration-300 w-[380px] flex-shrink-0">
      <div className="flex justify-center pt-3 pb-1 relative">
        <img src={customLogo} alt="Eghtesad Novin Bank" className="w-24 h-24 object-contain scale-[3]" />
        <button type="button" onClick={() => setIsOpen(false)} className="absolute top-2 left-2 z-10 w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-purple-800 text-lg shadow-sm" title="بستن منو">✕</button>
      </div>

      <div className="flex-1 rounded-3xl shadow-xl overflow-hidden mx-1 flex flex-col min-h-0" style={{ background: '#d6c6f0' }}>
        <div className="flex flex-col items-center py-4 border-b border-white/40 flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-bold text-lg shadow-lg">EN</div>
          <div className="mt-2 text-gray-800 font-bold text-[13.5px]">{user?.displayName || user?.username || 'کاربر'}</div>
        </div>

        <div className="px-3 pt-3 flex-shrink-0">
          <button type="button" onClick={goNewChat} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-800 text-white text-sm font-semibold shadow-md hover:bg-purple-700 active:scale-[0.99] transition">
            <span className="text-lg leading-none">＋</span> گفتگوی جدید
          </button>
        </div>

        <div className="px-3 pt-2 flex-1 overflow-y-auto min-h-0">
          <nav className="space-y-1 pb-4" dir="rtl">
            {sidebarItems.map((item) => {
              if (item.id === 6 || item.title === 'خروج') {
                return (
                  <button key={item.id} type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all">
                    <span className="text-xl">{item.icon}</span><span className="font-medium text-sm">خروج</span>
                  </button>
                );
              }

              if (item.title === 'درخواست ها' || item.title === 'درخواست‌ها') {
                return (
                  <div key={item.id} className="mb-1">
                    <button 
                      type="button"
                      onClick={() => {
                        const nextState = !showRequests;
                        setShowRequests(nextState);
                        if (nextState && unreadCount > 0) {
                          markAllSeen();
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-200 ${
                        showRequests ? 'bg-[#EDE9F9] text-[#6B21A8]' : 'text-gray-600 hover:bg-[#F3EFFE] hover:text-[#6B21A8]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span><span className="font-medium text-sm">{item.title}</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{unreadCount}</span>
                      )}
                    </button>

                    {showRequests && (
                      <div className="mt-1 mb-2 space-y-1.5 px-2 max-h-48 overflow-y-auto">
                        {items.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-3">هیچ درخواستی وجود ندارد</div>
                        ) : (
                          items.map(req => {
                            const isReady = req.status === 'ready' || req.status === 'seen';
                            const isQueued = req.status === 'queued' || req.status === 'seen_queued';
                            
                            return (
                              <div 
                                key={req.jobId} 
                                onClick={() => {
                                   if (req.status === 'ready') markSeen(req.jobId);
                                   if (req.conversationId) {
                                     navigate('/', { state: { conversationId: req.conversationId } });
                                     if (window.innerWidth < 768) setIsOpen(false);
                                   }
                                }}
                                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isReady ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 
                                  isQueued ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 
                                  'bg-rose-50 border-rose-200'
                                }`}
                              >
                                <div className="font-bold text-gray-800 mb-1.5 leading-relaxed truncate">{req.label}</div>
                                <div className="text-[10px] text-gray-500 flex justify-between items-center">
                                  <span>{new Date(req.createdAt).toLocaleTimeString('fa-IR')}</span>
                                  <span className={`px-1.5 py-0.5 rounded-md ${
                                    isReady ? 'bg-emerald-200/50 text-emerald-800' : 
                                    isQueued ? 'bg-blue-200/50 text-blue-800' : 
                                    'bg-rose-200/50 text-rose-800'
                                  }`}>
                                    {isReady ? 'آماده دانلود' : isQueued ? 'در حال ساخت' : 'خطا'}
                                  </span>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path || '/'}
                  end={item.path === '/'}
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-[#EDE9F9] text-[#6B21A8]' : 'text-gray-600 hover:bg-[#F3EFFE] hover:text-[#6B21A8]'}`}
                >
                  <span className="text-xl">{item.icon}</span><span className="font-medium text-sm">{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="px-3 pb-3 pt-1 flex-shrink-0">
          <div role="button" tabIndex={0} onClick={goNewChat} className="relative overflow-hidden cursor-pointer rounded-3xl p-4 flex flex-col items-center justify-center text-center" style={{ background: 'linear-gradient(160deg, #2D0A57 0%, #4B1A8A 50%, #6B2FBD 100%)', minHeight: '108px' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />
            <div className="mb-1 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="z-10"><div className="text-white text-xs font-bold">همراه مطمئن شما</div><div className="text-purple-300 text-[10px] mt-0.5">برای مدیریت مالی هوشمند</div></div>
            <div className="z-10 mt-2.5 text-[9px] font-bold bg-white/90 px-3 py-1 rounded-full text-purple-900 shadow-sm">دستیار هوشمند مالی مدیران</div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 p-3">
        <button type="button" onClick={() => setIsOpen(false)} className="w-full p-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm transition">بستن منو ←</button>
      </div>
    </aside>
  );
}