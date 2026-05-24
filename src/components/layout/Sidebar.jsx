import { NavLink, useNavigate } from 'react-router-dom';
import { sidebarItems } from "../../data/sidebarItems";

export default function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  return (
    <aside className={`bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden
      ${isOpen ? 'w-80' : 'w-20'}`}>

      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-purple-100">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 flex-shrink-0" />
        {isOpen && (
          <div>
            <div className="font-bold text-lg leading-tight">بانک اقتصاد نوین</div>
            <div className="text-xs text-gray-500">EGHTESAD NOVIN BANK</div>
          </div>
        )}
      </div>

      {/* User Info */}
      {isOpen && (
        <div className="flex flex-col items-center py-8 border-b border-purple-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2b0f57] to-[#7c56d6] flex items-center justify-center text-4xl font-bold text-white shadow-md">
            EN
          </div>
          <div className="mt-4 font-semibold">امین رضایی</div>
          <a href="#" className="text-purple-600 text-sm mt-1 hover:underline">مشاهده پروفایل</a>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-5 py-4 rounded-2xl text-right transition-all font-medium
              ${isActive ? 'bg-purple-100 text-purple-700 shadow-sm' : 'hover:bg-purple-50'}
            `}
          >
            <span className="text-2xl">{item.icon}</span>
            {isOpen && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* AI Assistant Banner Card */}
      {isOpen && (
        <div className="mx-4 mb-4">
          <div 
            onClick={() => navigate('/')}
            className="sb-banner__card relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-200 bg-gradient-to-br from-purple-100 to-white border border-purple-200 rounded-3xl p-5"
          >
            <div className="sb-banner__title text-purple-900 font-bold">باشید همراه مطمئن</div>
            <div className="sb-banner__sub text-gray-600 mt-1 text-sm">برای مدیریت مالی هوشمند</div>
            
            <div className="sb-banner__pill inline-block mt-4 text-xs font-bold bg-white px-4 py-1.5 rounded-full border border-purple-300 text-purple-700">
              دستیار رایگان
            </div>

            {/* Decorative Element */}
            <div className="sb-banner__illus absolute -bottom-6 -left-6 w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-500 opacity-75 rotate-12" />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="m-4 p-3 rounded-2xl hover:bg-purple-100 text-2xl transition-colors self-center"
      >
        {isOpen ? '←' : '→'}
      </button>
    </aside>
  );
}