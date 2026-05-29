// components/chat/QuickActions.jsx
import { quickActions } from "../../data/quickActions";

export default function QuickActions() {
  return (
    <div className="px-4 pb-3">
      <p className="text-[11px] text-purple-900 mb-2">دسترسی سریع</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {quickActions.map((item) => (
          <button
            key={item.id}
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium text-purple-900 shadow-sm transition-all active:scale-[0.97]"
          >
            <span className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-base">
              {item.icon}
            </span>
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}