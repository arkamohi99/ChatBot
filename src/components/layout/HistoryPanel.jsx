// components/history/HistoryPanel.jsx - Clean white card with dividers
import { historyGroups } from "../../data/historyItems";

export default function HistoryPanel() {
  return (
    <section className="h-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col overflow-hidden">
      <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <button className="w-9 h-9 rounded-2xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-lg transition">
          ✎
        </button>
        <h2 className="font-bold text-lg text-gray-800">تاریخچه گفتگوها</h2>
        <button className="w-9 h-9 rounded-2xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-xl transition">
          ≡
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {historyGroups.map((group, index) => (
          <div key={index}>
            <div className="text-xs text-gray-500 px-3 mb-2">{group.label}</div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <a
                  key={item.id}
                  href="#"
                  className={`flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all hover:border-purple-200 hover:bg-purple-50/30
                    ${item.selected ? 'border-purple-300 bg-purple-50' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-gray-800">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.time}</div>
                  </div>
                  <div className="text-2xl">{item.icon}</div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 text-center">
        <a href="#" className="text-purple-600 text-sm hover:underline">مشاهده همه گفتگوها ↓</a>
      </div>
    </section>
  );
}