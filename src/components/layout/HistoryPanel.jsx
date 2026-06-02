import React, { useState, useEffect } from 'react';
import Message from '../chat/Message';
import { getLocalHistory } from '../../services/history'; // ✅ Import local history

export default function HistoryPanel() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Load instantly from local storage, no async API call needed
    const localMessages = getLocalHistory();
    setConversations(localMessages);
    setLoading(false);
  }, []);

  return (
    <main className="h-full flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
      <header className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-purple-900">تاریخچه مکالمات</h2>
      </header>
      
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-purple-500">در حال بارگذاری...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-purple-400">هنوز گفتگویی وجود ندارد</div>
        ) : (
          conversations.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))
        )}
      </div>
    </main>
  );
}