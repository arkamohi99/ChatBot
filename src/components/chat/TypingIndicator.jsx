export default function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-5 py-4 bg-white/80 border border-purple-100 rounded-3xl w-fit">
      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '180ms' }}></div>
      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '350ms' }}></div>
    </div>
  );
}