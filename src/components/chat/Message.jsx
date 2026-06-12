import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Message({ message }) {
  const isMe = message.type === "user";

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-6`}>
      {!isMe && (
        <div className="w-10 h-10 rounded-full bg-purple-800 flex items-center justify-center text-white font-bold text-sm leading-tight mr-3 flex-shrink-0 shadow-sm">
          EN<br /><small className="text-[9px] opacity-90">AI</small>
        </div>
      )}

      <div className={`max-w-[520px] ${isMe ? 'items-end' : ''}`}>
        <div className={`rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm
          ${isMe 
            ? 'bg-purple-800 text-white' 
            : 'bg-gray-100 border border-gray-200 text-purple-900'
          }`}>
          
          {/* === USER MESSAGE === */}
          {message.messageType === "text" && isMe && (
            <p className="whitespace-pre-line">{message.text}</p>
          )}

          {/* === BOT MESSAGE WITH MARKDOWN === */}
          {message.messageType === "text" && !isMe && (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Make tables scrollable + nice looking
                  table: ({ children, ...props }) => (
                    <div className="my-3 overflow-auto max-h-[380px] rounded-xl border border-gray-200 bg-white shadow-sm">
                      <table 
                        className="w-full text-sm border-collapse" 
                        dir="rtl"
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-purple-100 text-purple-900 sticky top-0 z-10">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-right font-semibold border-b border-purple-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2 text-right border-b border-gray-100">
                      {children}
                    </td>
                  ),
                  // Optional: make bold text stand out more
                  strong: ({ children }) => (
                    <strong className="font-bold text-purple-950">{children}</strong>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}

          {/* === SPECIAL messageType (balance, etc.) === */}
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