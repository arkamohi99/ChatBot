// components/layout/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { sidebarItems } from "../../data/sidebarItems";
import customLogo from '../../assets/download.png'; // or use public path '/logo.png'

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`
        h-full flex flex-col rounded-3xl bg-white/70 backdrop-blur-xl shadow-xl border border-gray-100
        transition-all duration-300 overflow-hidden
        ${isOpen ? 'w-80' : 'w-20'}
      `}
    >
      {/* TOP AREA - Dark purple background, white text */}
      <div className="flex-shrink-0">
        <div className="p-4 flex items-center gap-3 bg-purple-800">
          {/* Custom PNG logo */}
          <img 
            src={customLogo} 
            alt="Logo" 
            className="w-10 h-10 rounded-2xl object-cover shadow-md"
          />
          {isOpen && (
            <div>
              <div className="font-bold text-base leading-tight text-white">بانک اقتصاد نوین</div>
              <div className="text-[11px] text-purple-200">EGHTESAD NOVIN BANK</div>
            </div>
          )}
        </div>

        {isOpen && (
          <div className="flex flex-col items-center py-4 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-2xl font-bold text-purple-800 shadow-inner">
              EN
            </div>
            <div className="mt-2 font-semibold text-purple-800 text-sm">امین رضایی</div>
            <a href="#" className="text-purple-600 text-xs mt-1 hover:text-purple-700 transition">مشاهده پروفایل</a>
          </div>
        )}
      </div>

      {/* SCROLLABLE AREA - dark purple text for nav items */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 hover:text-white hover:bg-purple-500 py-2.5 rounded-xl text-right transition-all duration-300 font-medium
                ${isActive
                  ? 'bg-purple-100 text-purple-800  border border-purple-200 shadow-sm'
                  : 'text-purple-700 hover:bg-purple-50 hover:text-purple-900'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {isOpen && <span className="text-sm">{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {isOpen && (
          <div className="px-3 pb-3 pt-1">
            <div
              onClick={() => navigate('/')}
              className="relative overflow-hidden cursor-pointer rounded-xl p-3 bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 hover:shadow-md transition-all duration-300"
            >
              <div className="text-purple-900 font-bold text-xs">باشید همراه مطمئن</div>
              <div className="text-purple-800 text-[11px] mt-0.5">برای مدیریت مالی هوشمند</div>
              <div className="inline-block mt-2 text-[10px] font-bold bg-white/80 px-2.5 py-1 rounded-full border border-purple-300 text-purple-800">
                دستیار رایگان
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM BUTTON */}
      <div className="flex-shrink-0 p-3 border-t border-gray-100">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-purple-700 text-xl transition-all duration-300"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>
    </aside>
  );
}