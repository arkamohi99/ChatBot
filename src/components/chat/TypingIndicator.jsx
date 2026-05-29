// components/chat/TypingIndicator.jsx - Gray dots for light mode
export default function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-5 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl w-fit">
      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '180ms' }}></div>
      <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '350ms' }}></div>
    </div>
  );
}