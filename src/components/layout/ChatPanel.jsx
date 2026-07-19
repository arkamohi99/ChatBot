import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socket';
import { getLocalHistory, saveLocalHistory } from '../../services/history';
import Message from '../chat/Message';
import TypingIndicator from '../chat/TypingIndicator';
import QuickActions from '../chat/QuickActions';

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);

  const { token, user } = useAuth();

  useEffect(() => {
    setMessages(getLocalHistory());

    if (!token) return;

    socketService.connect(token);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleBotReply = (payload) => {
      console.log('🤖 Bot Reply:', payload);
      const botMessage = payload.data || payload;

      setIsTyping(false);

      const normalizedMessage = {
        id: botMessage.id || `bot-${Date.now()}`,
        text: botMessage.text || '',
        type: botMessage.type || 'bot',
        messageType: botMessage.messageType || 'text',
        time: botMessage.time,
        timestamp: botMessage.timestamp || Date.now(),
      };

      setMessages(prev => {
        const updated = [...prev, normalizedMessage];
        saveLocalHistory(updated);
        return updated;
      });
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('bot_reply', handleBotReply);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('bot_reply', handleBotReply);
      socketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ Updated sendMessage (accepts optional message)
  const sendMessage = (overrideMessage) => {
    const messageToSend = (overrideMessage || inputMessage).trim();

    if (!messageToSend) {
      console.warn('❌ Empty message');
      return;
    }
    if (isTyping) return;
    if (!isConnected) {
      console.warn('❌ Socket not connected');
      return;
    }

    const newUserMessage = {
      id: `user-${Date.now()}`,
      text: messageToSend,
      type: 'user',
      messageType: 'text',
      time: new Date().toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      username: user?.username,
    };

    console.log('📝 User Message:', newUserMessage);

    const existingHistory = getLocalHistory();
    const updatedMessages = saveLocalHistory([...existingHistory, newUserMessage]);

    setMessages(updatedMessages);

    const contextMessages = updatedMessages
      .slice(-10)
      .map((msg) => ({
        id: msg.id,
        text: msg.text,
        type: msg.type,
        username: msg.username,
        timestamp: msg.timestamp,
      }));

    const payload = {
      action: 'send_message',
      contextMessages,
    };

    console.log('📤 Sending Payload:', JSON.stringify(payload, null, 2));
    socketService.emit(payload);

    setInputMessage('');
    setIsTyping(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ Updated: Send immediately when clicking Quick Action
  const handleQuickAction = (text) => {
    sendMessage(text);
  };

  return (
    <main className="h-full flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'متصل' : 'در حال اتصال...'}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-purple-400 text-sm">
            گفتگو را شروع کنید...
          </div>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id || `${msg.timestamp}-${Math.random()}`}
              message={msg}
            />
          ))
        )}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <QuickActions onAction={handleQuickAction} />

      <footer className="p-4 border-t border-gray-100 bg-purple-50 backdrop-blur-xl">
        <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-3xl p-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none px-6 text-[15px] placeholder:text-gray-400 text-right"
            placeholder="پیام خود را بنویسید..."
            disabled={!isConnected || isTyping}
          />

          <button
            onClick={() => sendMessage()}   // ← Add the arrow function
            disabled={!isConnected || isTyping || !inputMessage.trim()}
            className="w-12 h-12 bg-purple-800 text-white rounded-2xl flex items-center justify-center text-2xl hover:bg-purple-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-3">
          دستیار هوشمند بانک اقتصاد نوین ممکن است مرتکب اشتباه شود
        </p>
      </footer>
    </main>
  );
}