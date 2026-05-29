<<<<<<< HEAD
=======
// components/chat/Message.jsx
>>>>>>> d6616df (Update componets)
export default function Message({ message }) {
  const isMe = message.type === "me";

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-6`}>
      {!isMe && (
<<<<<<< HEAD
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2b0f57] to-[#7c56d6] flex items-center justify-center text-white font-bold text-sm leading-tight mr-3 flex-shrink-0 shadow-md">
          EN<br /><small className="text-[9px] opacity-75">AI</small>
=======
        // Dark purple circle
        <div className="w-10 h-10 rounded-full bg-purple-800 flex items-center justify-center text-white font-bold text-sm leading-tight mr-3 flex-shrink-0 shadow-sm">
          EN<br /><small className="text-[9px] opacity-90">AI</small>
>>>>>>> d6616df (Update componets)
        </div>
      )}

      <div className={`max-w-[520px] ${isMe ? 'items-end' : ''}`}>
<<<<<<< HEAD
        <div className={`rounded-3xl px-5 py-4 text-[15px] leading-relaxed shadow-sm
          ${isMe 
            ? 'bg-gradient-to-br from-[#2b0f57] to-[#6c44c9] text-white' 
            : 'bg-white/95 border border-purple-100'
=======
        <div className={`rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm
          ${isMe 
            ? 'bg-purple-800 text-white' 
            : 'bg-gray-100 border border-gray-200 text-purple-900'   // dark purple text for AI message
>>>>>>> d6616df (Update componets)
          }`}>
          
          {message.messageType === "text" && (
            <p className="whitespace-pre-line">{message.text}</p>
          )}

          {message.messageType === "balance" && (
            <>
<<<<<<< HEAD
              <p className="font-bold text-purple-700 mb-1">مانده حساب شما:</p>
              <p className="text-3xl font-black text-[#2b0f57]">{message.amount}</p>
              <p className="text-xs text-gray-500 mt-2">{message.sub}</p>
=======
              <p className="text-3xl font-black text-purple-800">{message.amount}</p>
              <p className="text-xs text-purple-600 mt-2">{message.sub}</p>
>>>>>>> d6616df (Update componets)
            </>
          )}
        </div>

<<<<<<< HEAD
        <p className={`text-[11px] mt-1.5 px-2 ${isMe ? 'text-right text-purple-200' : 'text-gray-500'}`}>
=======
        <p className={`text-[11px] mt-1.5 px-2 ${isMe ? 'text-right text-purple-500' : 'text-purple-500'}`}>
>>>>>>> d6616df (Update componets)
          {message.time}
        </p>
      </div>
    </div>
  );
}