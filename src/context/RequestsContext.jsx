import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const RequestsContext = createContext(null);

export function RequestsProvider({ children }) {
  const [items, setItems] = useState([]);

  const addQueued = useCallback((job) => {
    setItems((prev) => {
      const id = String(job.job_id || job.jobId || `${job.message_id}-${Date.now()}`);
      if (prev.some((x) => x.jobId === id)) return prev;
      return [
        {
          jobId: id,
          conversationId: job.conversation_id ?? job.conversationId,
          messageId: job.message_id ?? job.messageId,
          status: 'queued',
          label: job.message || job.label || 'درخواست اکسل کامل',
          rowCount: job.row_count ?? job.rowCount,
          export_files: job.export_files || [], // 💡 این فیلد برای چند فایل مهم است
          createdAt: Date.now(),
        },
        ...prev,
      ].slice(0, 50);
    });
  }, []);

  const markReady = useCallback((job) => {
    const id = String(job.job_id || job.jobId || '');
    setItems((prev) =>
      prev.map((x) =>
        x.jobId === id ||
        (String(x.messageId) === String(job.message_id) &&
          String(x.conversationId) === String(job.conversation_id))
          ? {
              ...x,
              status: 'ready',
              downloadUrl: job.download_url,
              fileName: job.file_name,
              export_files: job.export_files || x.export_files, // 💡 بروزرسانی فایل‌ها
              label: job.message || x.label || 'اکسل آماده است',
            }
          : x
      )
    );
  }, []);

  const markFailed = useCallback((job) => {
    const id = String(job.job_id || job.jobId || '');
    setItems((prev) =>
      prev.map((x) =>
        x.jobId === id || String(x.messageId) === String(job.message_id)
          ? { ...x, status: 'failed', label: job.message || 'خطا در ساخت اکسل' }
          : x
      )
    );
  }, []);

  const markSeen = useCallback((jobId) => {
    setItems((prev) =>
      prev.map((x) => (x.jobId === jobId ? { ...x, status: 'seen' } : x))
    );
  }, []);

  const markAllSeen = useCallback(() => {
    setItems((prev) =>
      prev.map((x) => {
        if (x.status === 'ready') return { ...x, status: 'seen' };
        if (x.status === 'queued') return { ...x, status: 'seen_queued' };
        return x;
      })
    );
  }, []);

  const unreadCount = useMemo(
    () => items.filter((x) => x.status === 'ready' || x.status === 'queued').length,
    [items]
  );

  const value = useMemo(
    () => ({ items, unreadCount, addQueued, markReady, markFailed, markSeen, markAllSeen }),
    [items, unreadCount, addQueued, markReady, markFailed, markSeen, markAllSeen]
  );

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) return { items: [], unreadCount: 0, addQueued: () => {}, markReady: () => {}, markFailed: () => {}, markSeen: () => {}, markAllSeen: () => {} };
  return ctx;
}