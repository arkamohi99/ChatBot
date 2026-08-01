import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socket';
import { conversationApi } from '../../services/conversationApi';
import Message from '../chat/Message';
import TypingIndicator from '../chat/TypingIndicator';
import QuickActions from '../chat/QuickActions';
import { useRequests } from '../../context/RequestsContext';

export default function ChatPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  
  // 💡 اضافه کردن Ref برای درخواست‌ها تا موقع رندر تاریخچه در دسترس باشند
  const { items: requestItems, addQueued, markReady, markFailed } = useRequests();
  const requestItemsRef = useRef(requestItems);
  useEffect(() => {
      requestItemsRef.current = requestItems;
  }, [requestItems]);

  const [messages, setMessages] = useState([]);
  const exportEstimatesRef = useRef({});

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isFirstLoad = useRef(true);
  const sendingRef = useRef(false);

  const conversationIdRef = useRef(conversationId);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

  const mapServerTurn = (m) => {
    const bubbles = [];
    const time = new Date(m.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const timestamp = new Date(m.created_at).getTime();

    if (m.user_query) {
      bubbles.push({
        id: `user-${m.id}`, text: m.user_query, type: 'user', messageType: 'text', time, timestamp, raw: m,
      });
    }
    if (m.narrative) {
      const matchedJob = requestItemsRef.current.find(req => 
          String(req.messageId) === String(m.id) && 
          (req.status === 'ready' || req.status === 'seen')
      );
      
      let exportFiles = matchedJob?.export_files || [];
      
      // 💡 خواندن لیست فایل‌ها از API در صورتی که کاربر صفحه را رفرش کرده باشد
      if (exportFiles.length === 0 && m.export_file_name && typeof m.export_file_name === 'string' && m.export_file_name.startsWith('[')) {
          try {
              exportFiles = JSON.parse(m.export_file_name);
          } catch(e) {}
      }

      bubbles.push({
        id: m.id, text: m.narrative, type: 'bot', messageType: 'text', time, timestamp: timestamp + 1, raw: m,
        reaction: m.reaction === true || m.reaction === false ? m.reaction : null, review: m.review || null,
        metadata: {
          has_exportable_data: !!m.has_exportable_data || !!matchedJob, 
          export_file_id: m.export_file_id ?? null,
          export_file_name: m.export_file_name ?? null, 
          table_available: !!m.has_exportable_data || !!matchedJob,
          conversation_id: m.conversation_id, 
          message_id: m.id,
          export_files: exportFiles.length > 0 ? exportFiles : undefined
        },
      });
    }
    return bubbles;
  };

  const loadConversation = useCallback(async (id) => {
    if (!id) return;
    setInitialLoading(true); setMessages([]); setNextCursor(null); setHasMore(false);
    try {
      const res = await conversationApi.getMessages(id, { limit: 40 });
      setMessages([...res.data.items].reverse().flatMap(mapServerTurn));
      setNextCursor(res.data.next_cursor || null); setHasMore(!!res.data.next_cursor); setConversationId(id);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setInitialLoading(false); isFirstLoad.current = true;
    }
  }, []);

  useEffect(() => {
    if (location.state?.conversationId) {
      loadConversation(location.state.conversationId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, loadConversation, navigate, location.pathname]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !nextCursor || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    try {
      const res = await conversationApi.getMessages(conversationId, { limit: 40, before_id: nextCursor.before_id, before_created_at: nextCursor.before_created_at });
      if (res.data.items.length === 0) { setHasMore(false); return; }
      setMessages((prev) => [...[...res.data.items].reverse().flatMap(mapServerTurn), ...prev]);
      setNextCursor(res.data.next_cursor || null); setHasMore(!!res.data.next_cursor);
      requestAnimationFrame(() => { if (container) container.scrollTop = container.scrollHeight - prevScrollHeight; });
    } catch (err) { console.error('Failed:', err); } finally { setLoadingOlder(false); }
  }, [conversationId, nextCursor, loadingOlder, hasMore]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (el && !loadingOlder && hasMore && el.scrollTop < 80) loadOlderMessages();
  };

  const handleExport = useCallback(async (message, options = {}) => {
    const mode = options.mode || 'create';
    const convId = conversationId || message?.metadata?.conversation_id || null;
    const msgId = Number(message?.metadata?.message_id ?? message?.id);

    if (!Number.isFinite(msgId) || msgId <= 0 || !convId) {
      alert('شناسه گفتگو یا پیام پیدا نشد.'); return;
    }

    if (mode === 'download') {
      try {
        const fileName =
          message?.metadata?.export_file?.file_name ||
          message?.metadata?.export_file_name ||
          'export.xlsx';
        const fileId =
          message?.metadata?.export_file?.id ??
          message?.metadata?.export_file?.file_id ??
          message?.metadata?.export_file_id ??
          null;
        await conversationApi.downloadExportFile(Number(convId), msgId, fileName, fileId);
      } catch (err) {
        alert(err?.response?.status === 404 || err?.response?.status === 410 ? 'فایل در دسترس نیست.' : 'دانلود فایل ممکن نشد.');
      }
      return;
    }

    exportEstimatesRef.current[msgId] = message?.metadata?.data_cap_estimated;

    setExportingId(msgId);
    socketService.emit({
      action: 'export_table', message_id: msgId, conversation_id: Number(convId),
      export_scope: mode === 'create_full' ? 'full' : 'capped',
    });
    setTimeout(() => setExportingId(null), 8000);
  }, [conversationId]);

  // 💡 REMOVED: handleConfirmRowCap — its only consumer was Message.jsx's
  // now-removed row-cap-confirm button, and the backend action it emitted
  // ("confirm_row_cap") has no handler anymore (see websocket_router.py
  // cleanup — that branch was deleted, ProcessBankQueryUseCase.execute_
  // confirmed_row_cap doesn't exist). Emitting it today would just fall
  // through to the generic "No messages provided" error on the backend.

  useEffect(() => {
    if (!token) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onBotReply = (payload) => {
      setIsTyping(false); sendingRef.current = false; setExportingId(null);
      const bot = payload.data || payload;
      
      if (bot.metadata?.conversation_id) setConversationId(bot.metadata.conversation_id);

      const exportFile = bot.metadata?.export_file;
      if (exportFile?.download_url || exportFile?.url) {
        const cId = bot.metadata?.conversation_id || conversationIdRef.current;
        const mId = bot.metadata?.message_id || bot.id;
        if (cId && mId) conversationApi.downloadExportFile(Number(cId), Number(mId), exportFile.file_name).catch(() => {});
      }

      const normalized = {
        id: bot.id || bot.metadata?.message_id || `bot-${Date.now()}`,
        text: bot.text || '', type: 'bot', messageType: bot.messageType || 'text',
        time: bot.time || new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: bot.timestamp || Date.now(), data: bot.data,
        metadata: {
          ...(bot.metadata || {}), has_exportable_data: !!(bot.metadata?.export_file || bot.metadata?.has_exportable_data),
          message_id: bot.metadata?.message_id || bot.id, 
          conversation_id: bot.metadata?.conversation_id || conversationIdRef.current || null,
        },
      };

      setMessages((prev) => {
        if (normalized.id != null && prev.some((m) => String(m.id) === String(normalized.id))) {
          return prev.map((m) => String(m.id) === String(normalized.id) ? { ...m, ...normalized } : m);
        }
        return [...prev, normalized];
      });
    };

    const onExportQueued = (payload) => {
      const d = payload?.data || payload;
      setExportingId(null);
      const estimated = exportEstimatesRef.current[d.message_id];
      const textMsg = estimated 
        ? `درخواست اکسل کامل در صف قرار گرفت (حدود ${estimated.toLocaleString('fa-IR')} ردیف). پس از آماده‌شدن مطلع می‌شوید.`
        : d?.message || 'درخواست اکسل کامل در صف قرار گرفت.';

      addQueued({ ...d, message: textMsg });
      setMessages((prev) => [...prev, { id: `export-queued-${d?.job_id || Date.now()}`, text: textMsg, type: 'bot', messageType: 'text', timestamp: Date.now() }]);
    };

    const onExportReady = (payload) => {
      const d = payload?.data || payload;
      setExportingId(null);
      markReady(d || {});
      
      const fileMeta = { download_url: d?.download_url, file_name: d?.file_name };
      const exportFiles = d?.export_files && d.export_files.length > 0 ? d.export_files : [fileMeta];
      
      setMessages((prev) => {
        const mid = d?.message_id;
        const jobId = d?.job_id;
        const queuedId = `export-queued-${jobId}`;
        let hasQueuedMsg = false;
        
        const next = prev.map((m) => {
          if (mid != null && (String(m.id) === String(mid) || String(m.metadata?.message_id) === String(mid))) {
            return {
              ...m, metadata: { ...m.metadata, export_file: fileMeta, has_exportable_data: true, export_files: exportFiles }
            };
          }
          if (String(m.id) === queuedId) {
            hasQueuedMsg = true;
            return {
              ...m, id: `export-ready-${jobId}`, text: d?.message || 'فایل اکسل شما آماده دانلود است.',
              metadata: { export_file: fileMeta, has_exportable_data: true, message_id: mid, conversation_id: d?.conversation_id, export_files: exportFiles }
            };
          }
          return m;
        });

        if (!hasQueuedMsg) {
          next.push({
            id: `export-ready-${jobId || Date.now()}`, text: d?.message || 'فایل اکسل شما آماده دانلود است.', type: 'bot', messageType: 'text', timestamp: Date.now(),
            metadata: { export_file: fileMeta, has_exportable_data: true, message_id: mid, conversation_id: d?.conversation_id, export_files: exportFiles }
          });
        }
        return next;
      });
    };

    const onExportFailed = (payload) => {
      const d = payload?.data || payload;
      setExportingId(null);
      markFailed(d || {});
      setMessages((prev) => {
        const jobId = d?.job_id;
        const queuedId = `export-queued-${jobId}`;
        let hasQueuedMsg = false;
        const next = prev.map((m) => {
          if (String(m.id) === queuedId) {
            hasQueuedMsg = true; return { ...m, id: `export-failed-${jobId}`, text: d?.message || 'ساخت فایل اکسل با خطا مواجه شد.' };
          }
          return m;
        });
        if (!hasQueuedMsg) next.push({ id: `export-failed-${jobId || Date.now()}`, text: d?.message || 'ساخت فایل با خطا مواجه شد.', type: 'bot', messageType: 'text', timestamp: Date.now() });
        return next;
      });
    };

    socketService.on('connect', onConnect); 
    socketService.on('disconnect', onDisconnect);
    socketService.on('bot_reply', onBotReply); 
    socketService.on('export_queued', onExportQueued);
    socketService.on('export_ready', onExportReady); 
    socketService.on('export_failed', onExportFailed);

    socketService.connect(token);

    if (socketService.socket?.readyState === 1) {
      setIsConnected(true);
    }

    return () => {
      socketService.off('connect', onConnect); 
      socketService.off('disconnect', onDisconnect);
      socketService.off('bot_reply', onBotReply); 
      socketService.off('export_queued', onExportQueued);
      socketService.off('export_ready', onExportReady); 
      socketService.off('export_failed', onExportFailed);
    };
  }, [token, addQueued, markReady, markFailed]);

  useEffect(() => {
    if (isFirstLoad.current || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      isFirstLoad.current = false;
    }
  }, [messages, isTyping]);

  const sendMessage = (overrideText) => {
    const text = (overrideText || inputMessage).trim();
    if (!text || isTyping || !isConnected || sendingRef.current) return;
    sendingRef.current = true; setIsTyping(true);
    const userMsg = {
      id: `user-${Date.now()}`, text, type: 'user', messageType: 'text',
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(), username: user?.username,
    };
    const newMessages = [...messages, userMsg];
    const contextMessages = newMessages.slice(-5).map((m) => ({ id: m.id, text: m.text, type: m.type === 'bot' ? 'bot' : 'user', username: m.username, timestamp: m.timestamp }));
    setMessages(newMessages);
    
    socketService.emit({ contextMessages, conversation_id: conversationId || null });
    setInputMessage('');
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  
  // دکمه نیو چت دیگر کارش را به Sidebar سپرده، اما اگر اینجا استفاده شود ریست می‌کند
  const startNewConversation = () => { setMessages([]); setConversationId(null); setNextCursor(null); setHasMore(false); sendingRef.current = false; setIsTyping(false); setExportingId(null); };

  const handleReaction = useCallback(async (message, { reaction, comment }) => {
    const convId = conversationId || message?.metadata?.conversation_id || null;
    const msgId = Number(message?.metadata?.message_id ?? message?.id);
    if (!Number.isFinite(msgId) || msgId <= 0 || !convId) return;
    await conversationApi.setReaction(Number(convId), msgId, reaction, comment || null);
    setMessages((prev) => prev.map((m) => String(m.id) === String(msgId) ? { ...m, reaction, review: comment || null } : m));
  }, [conversationId]);

  return (
    <main className="h-full flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-auto p-6">
        {initialLoading && <div className="text-center text-purple-500 py-8">در حال بارگذاری گفتگو...</div>}
        {loadingOlder && <div className="text-center text-xs text-purple-400 py-3">در حال دریافت پیام‌های قبلی...</div>}
        {!initialLoading && messages.length === 0 && <div className="h-full flex items-center justify-center text-purple-400 text-sm">گفتگو را شروع کنید...</div>}

        {messages.map((msg) => (
          <Message key={msg.id} message={msg} onExport={handleExport} onReaction={handleReaction} conversationId={conversationId} exportingId={exportingId} />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <QuickActions onAction={sendMessage} />

      <footer className="p-4 border-t border-gray-100 bg-purple-50/80">
        <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-3xl p-2">
          <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={handleKeyDown} disabled={!isConnected || isTyping} className="flex-1 bg-transparent outline-none px-6 text-[15px] placeholder:text-gray-400 text-right" placeholder="پیام خود را بنویسید..." />
          <button onClick={() => sendMessage()} disabled={!isConnected || isTyping || !inputMessage.trim()} className="w-12 h-12 bg-purple-800 text-white rounded-2xl flex items-center justify-center text-2xl hover:bg-purple-700 transition disabled:opacity-50">➤</button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3">دستیار هوشمند بانک اقتصاد نوین ممکن است مرتکب اشتباه شود</p>
      </footer>
    </main>
  );
}