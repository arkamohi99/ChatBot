import { quickActions } from "../../data/quickActions";

export default function QuickActions() {
  return (
    <div className="px-6 pb-6">
      <p className="text-xs text-gray-500 mb-3">دسترسی سریع</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((item) => (
          <button
            key={item.id}
            className="flex items-center justify-center gap-2.5 bg-white hover:bg-white/90 border border-purple-100 hover:border-purple-200 rounded-2xl py-3.5 px-4 text-sm font-bold shadow-sm transition-all active:scale-[0.97]"
          >
            <span className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-xl">
              {item.icon}
            </span>
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}