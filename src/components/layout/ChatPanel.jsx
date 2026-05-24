import Message from "../chat/Message";
import TypingIndicator from "../chat/TypingIndicator";
import QuickActions from "../chat/QuickActions";
import { messages } from "../../data/messages";

export default function ChatPanel() {
  return (
<main className="flex-1 flex flex-col bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center justify-end gap-4">
        <button className="w-10 h-10 rounded-2xl border hover:bg-gray-100 flex items-center justify-center text-xl">🔔</button>
        <div className="flex items-center gap-2 bg-white border border-purple-100 rounded-full px-5 py-2">
          <span className="font-black text-purple-900">EN</span>
          <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full font-bold">AI</span>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        <TypingIndicator />
      </div>

      <QuickActions />

      {/* Input Area */}
      <footer className="p-5 border-t bg-white/80">
        <div className="flex gap-3 bg-white border border-purple-100 rounded-3xl p-2 shadow-sm">
          <input
            type="text"
            className="flex-1 bg-transparent outline-none px-6 text-[15px]"
            placeholder="پیام خود را بنویسید..."
          />
          <button className="w-12 h-12 rounded-2xl hover:bg-purple-50 text-xl transition">🎙️</button>
          <button className="w-12 h-12 bg-gradient-to-br from-[#2b0f57] to-[#7c56d6] text-white rounded-2xl flex items-center justify-center text-2xl hover:brightness-110 transition">
            ➤
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4">
          دستیار هوشمند بانک اقتصاد نوین
        </p>
      </footer>
    </main>
  );
}