// components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { sidebarItems } from "../../data/sidebarItems";
import customLogo from '../../assets/logo_image.png';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/login');
  };

  return (
    <aside
      className={`
        h-full flex flex-col overflow-hidden
        transition-all duration-300
        ${isOpen ? 'w-100' : 'w-20'}
      `}
    >
      {/* ========== LOGO ========== */}
      {isOpen && (
        <div className="flex justify-center pt-5 pb-3">
          <img
            src={customLogo}
            alt="Eghtesad Novin Bank"
            className="w-30 h-30 object-contain scale-[4]"
          />
        </div>
      )}

      {/* ========== MAIN WHITE CARD ========== */}
      <div
        className="flex-1 rounded-3xl shadow-xl overflow-hidden mx-1 flex flex-col"
        style={{ background: '#d6c6f0' }}
      >

        {/* PROFILE */}
        {isOpen && (
          <div className="flex flex-col items-center py-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              EN
            </div>
            <div className="mt-3 text-gray-800 font-bold text-[15px]">
              {user?.displayName || 'testuser'}
            </div>
            <a href="#" className="mt-1 text-sm text-gray-400 hover:text-purple-600 transition flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              مشاهده پروفایل
            </a>
          </div>
        )}

        {/* MENU */}
        <div className="px-4 pt-3 flex-1 overflow-y-auto">
          <nav className="space-y-1" dir="rtl">
            {sidebarItems.map((item) => {
              if (item.id === 6) {
                return (
                  <button
                    key={item.id}
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
                  >
                    <span className="text-xl">{item.icon}</span>
                    {isOpen && <span className="font-medium text-sm">خروج</span>}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                    ${isActive
                      ? 'bg-[#EDE9F9] text-[#6B21A8]'
                      : 'text-gray-600 hover:bg-[#F3EFFE] hover:text-[#6B21A8]'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  {isOpen && <span className="font-medium text-sm">{item.title}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM PROMO CARD */}
        {isOpen && (
          <div className="px-4 pb-4 pt-2">
            <div
              onClick={() => navigate('/')}
              className="relative overflow-hidden cursor-pointer rounded-3xl p-5 flex flex-col items-center justify-center text-center"
              style={{
                background: 'linear-gradient(160deg, #2D0A57 0%, #4B1A8A 50%, #6B2FBD 100%)',
                minHeight: '160px',
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />

              <div className="mb-2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>

              <div className="z-10">
                <div className="text-white text-sm font-bold">همراه مطمئن شما</div>
                <div className="text-purple-300 text-xs mt-1">برای مدیریت مالی هوشمند</div>
              </div>

              <div className="z-10 mt-4 text-[10px] font-bold bg-white/90 px-4 py-1.5 rounded-full text-purple-900 shadow-sm">
                دستیار هوشمند مالی مدیران
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOGGLE BUTTON */}
      <div className="flex-shrink-0 p-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 text-xl transition-all duration-300"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>
    </aside>
  );
}
