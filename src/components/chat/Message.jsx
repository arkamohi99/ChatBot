// components/chat/Message.jsx
export default function Message({ message }) {
  const isMe = message.type === "me";

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-6`}>
      {!isMe && (
        // Dark purple circle
        <div className="w-10 h-10 rounded-full bg-purple-800 flex items-center justify-center text-white font-bold text-sm leading-tight mr-3 flex-shrink-0 shadow-sm">
          EN<br /><small className="text-[9px] opacity-90">AI</small>
        </div>
      )}

      <div className={`max-w-[520px] ${isMe ? 'items-end' : ''}`}>
        <div className={`rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm
          ${isMe 
            ? 'bg-purple-800 text-white' 
            : 'bg-gray-100 border border-gray-200 text-purple-900'   // dark purple text for AI message
          }`}>
          
          {message.messageType === "text" && (
            <p className="whitespace-pre-line">{message.text}</p>
          )}

          {message.messageType === "balance" && (
            <>
              <p className="text-3xl font-black text-purple-800">{message.amount}</p>
              <p className="text-xs text-purple-600 mt-2">{message.sub}</p>
            </>
          )}
        </div>

        <p className={`text-[11px] mt-1.5 px-2 ${isMe ? 'text-right text-purple-500' : 'text-purple-500'}`}>
          {message.time}
        </p>
      </div>
    </div>
  );
}