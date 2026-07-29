import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '../../services/conversationApi';

export default function HistoryPanel() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  const loadConversations = async (cursor = null) => {
    try {
      if (cursor) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const res = await conversationApi.list({
        limit: 30,
        before_last_message_at: cursor || undefined,
      });

      const items = res.data?.items || [];
      const cursorValue = res.data?.next_cursor;

      if (cursor) {
        setConversations((prev) => [...prev, ...items]);
      } else {
        setConversations(items);
      }

      setNextCursor(cursorValue || null);
    } catch (err) {
      console.error(err);
      setError('خطا در دریافت تاریخچه — اتصال یا ورود را بررسی کنید');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const openConversation = (id) => {
    navigate('/', { state: { conversationId: id } });
  };

  const goNewChat = () => {
    navigate('/');
  };

  return (
    <main className="h-full flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
      <header
        className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3"
        dir="rtl"
      >
        <div>
          <h2 className="text-xl font-bold text-purple-900">تاریخچه گفتگوها</h2>
          <p className="text-[11px] text-purple-400 mt-0.5">
            برای ادامه، یک گفتگو را انتخاب کنید
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="text-center text-purple-500 py-10">در حال بارگذاری...</div>
        )}

        {error && (
          <div className="text-center py-10 space-y-3">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => loadConversations()}
              className="text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-purple-400">هنوز گفتگویی وجود ندارد</p>
            <button
              type="button"
              onClick={goNewChat}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl
                         bg-purple-800 text-white text-sm font-medium hover:bg-purple-700"
            >
              شروع گفتگوی جدید
            </button>
          </div>
        )}

        <div className="space-y-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openConversation(c.id)}
              className="w-full text-right p-4 rounded-2xl bg-white/70 hover:bg-purple-50 border border-gray-100 transition group"
            >
              <div className="font-semibold text-purple-900 text-[15px] truncate group-hover:text-purple-700">
                {c.title || `گفتگو #${c.id}`}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1.5">
                <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                  {c.message_count} پیام
                </span>
                <span>
                  {c.last_message_at
                    ? new Date(c.last_message_at).toLocaleString('fa-IR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
            </button>
          ))}
        </div>

        {nextCursor && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => loadConversations(nextCursor)}
              disabled={loadingMore}
              className="text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 px-5 py-2 rounded-xl transition disabled:opacity-50"
            >
              {loadingMore ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}