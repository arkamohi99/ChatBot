import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const EXPORT_TTL_MS = 10 * 60 * 1000;

/** Small Excel-style icon (green sheet) */
function ExcelIcon({ className = 'w-9 h-9' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="4" y="2" width="26" height="34" rx="3" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="1.5" />
      <path d="M10 10h14M10 16h14M10 22h14M10 28h8" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="18" y="20" width="18" height="16" rx="2" fill="#2E7D32" />
      <text x="27" y="32" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">
        XLS
      </text>
    </svg>
  );
}

/**
 * Temp: soft pill under the bubble (request build).
 * Permanent: Telegram-style file card (icon + name + size hint).
 * Both centered under the message bubble.
 */
export default function Message({ message, onExport, onConfirmRowCap, onReaction, conversationId, exportingId }) {
  const isMe = message.type === 'user' || message.type === 'me';
  const [downloading, setDownloading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [feedbackDone, setFeedbackDone] = useState(
    () => message.reaction === true || message.reaction === false
  );
  const [feedbackChoice, setFeedbackChoice] = useState(
    () => (message.reaction === true ? 'like' : message.reaction === false ? 'dislike' : null)
  );
  const [showDislikeBox, setShowDislikeBox] = useState(false);
  const [dislikeText, setDislikeText] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  const meta = message.metadata || {};
  const messageType = message.messageType || 'text';
  const text = message.text || '';

  const idStr = String(message.id ?? '');
  const numericId = Number(message.id);
  const hasRealId =
    Number.isFinite(numericId) &&
    numericId > 0 &&
    !idStr.startsWith('bot-') &&
    !idStr.startsWith('user-');

  const exportFile = meta.export_file;
  const hasPermanentFile =
    !!exportFile ||
    meta.has_exportable_data === true ||
    meta.export_file_id != null;

  const exportFiles = Array.isArray(meta.export_files) && meta.export_files.length
    ? meta.export_files
    : hasPermanentFile
      ? [{ file_name: exportFile?.file_name || meta.export_file_name || 'گزارش.xlsx', file_id: meta.export_file_id }]
      : [];

  const fileName =
    exportFile?.file_name ||
    meta.export_file_name ||
    'گزارش.xlsx';

  const tableAvailable =
    meta.table_available === true ||
    meta.export_ready_now === true ||
    (Array.isArray(meta.per_branch_data) && meta.per_branch_data.length > 0) ||
    (Array.isArray(message.data) && message.data.length > 0);

  const createdAt = message.timestamp || Date.now();
  const stillWithinTtl = now - createdAt < EXPORT_TTL_MS;

  const dataCapped = meta.data_capped === true;
  const capLimit = Number(meta.data_cap_limit) || 10000;
  const capEstimated = Number(meta.data_cap_estimated) || 0;
  const offerFullExport =
    dataCapped && capEstimated > capLimit;

  const showTempExportBtn =
    !isMe && hasRealId && tableAvailable && stillWithinTtl && !hasPermanentFile;

  const needsRowCapConfirm =
    !isMe && hasRealId && meta.row_cap_pending === true;

  const isExporting = exportingId === message.id || exportingId === numericId;

  useEffect(() => {
    if (!showTempExportBtn) return undefined;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [showTempExportBtn]);

  const handleTempExport = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onExport || isExporting || downloading) return;
    setDownloading(true);
    try {
      await onExport(message, { mode: 'create' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePermanentDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onExport || downloading) return;
    setDownloading(true);
    try {
      await onExport(message, { mode: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const showFeedback =
    !isMe &&
    hasRealId &&
    messageType !== 'balance' &&
    typeof onReaction === 'function' &&
    conversationId != null;

  const showActions =
    !isMe && (showTempExportBtn || needsRowCapConfirm || hasPermanentFile || showFeedback);


  const submitReaction = async (liked, comment = null) => {
    if (!onReaction || feedbackBusy || feedbackDone) return;
    setFeedbackBusy(true);
    try {
      await onReaction(message, { reaction: liked, comment });
      setFeedbackChoice(liked ? 'like' : 'dislike');
      setFeedbackDone(true);
      setShowDislikeBox(false);
    } catch (err) {
      console.error('reaction failed', err);
    } finally {
      setFeedbackBusy(false);
    }
  };

  const handleLike = () => submitReaction(true, null);

  const handleDislikeClick = () => {
    setShowDislikeBox(true);
    setFeedbackChoice('dislike');
  };

  const handleDislikeSubmit = () => {
    submitReaction(false, dislikeText.trim() || null);
  };

  return (
    <div
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-6`}
      dir="ltr"
    >
      {!isMe && (
        <div className="w-10 h-10 mr-3 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-white font-bold text-sm leading-tight flex-shrink-0 shadow-md">
          EN
          <br />
          <small className="text-[9px] opacity-90">AI</small>
        </div>
      )}

      <div
        className={`max-w-[560px] w-full flex flex-col ${
          isMe ? 'items-end' : 'items-center'
        }`}
      >
        {/* Bubble — keep text aligned for readability */}
        <div
          className={`w-full px-5 py-3.5 text-[15px] leading-relaxed shadow-sm text-right
            ${
              isMe
                ? 'bg-purple-800 text-white rounded-2xl rounded-tr-sm'
                : 'bg-white border border-gray-100/80 text-purple-950 rounded-2xl rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
            }`}
          dir="rtl"
        >
          {isMe && messageType !== 'balance' && (
            <p className="whitespace-pre-line">{text}</p>
          )}

          {!isMe && messageType !== 'balance' && (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children, ...props }) => (
                    <div className="my-3 overflow-auto max-h-[380px] rounded-xl border border-gray-200 bg-white shadow-sm">
                      <table className="w-full text-sm border-collapse" {...props}>
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
                  strong: ({ children }) => (
                    <strong className="font-bold text-purple-950">{children}</strong>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}

          {messageType === 'balance' && (
            <>
              <p className="text-3xl font-black text-purple-800">{message.amount}</p>
              <p className="text-xs text-purple-600 mt-2">{message.sub}</p>
            </>
          )}
        </div>

        {/* Actions centered under bubble */}
        {showActions && (
          <div
            className="mt-2.5 flex flex-col items-center gap-2 w-full max-w-[320px]"
            dir="rtl"
          >
            {needsRowCapConfirm && onConfirmRowCap && (
              <button
                type="button"
                onClick={() => onConfirmRowCap(message)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl
                           text-[13px] font-medium text-amber-900
                           bg-amber-50 border border-amber-200/80
                           hover:bg-amber-100 hover:border-amber-300
                           active:scale-[0.98] transition-all duration-150 shadow-sm"
              >
                <span className="text-base leading-none">⚠️</span>
                <span>تایید و ادامه (۱۰٬۰۰۰ ردیف نخست)</span>
              </button>
            )}

            {/* Excel options — under bubble */}
            {showTempExportBtn && (
              <div className="w-full flex flex-col gap-2">
                {offerFullExport ? (
                  <>
                    <p className="text-[11px] text-center text-purple-500/90 leading-relaxed px-1">
                      حجم داده حدود{' '}
                      <strong>{capEstimated.toLocaleString('fa-IR')}</strong> ردیف است.
                      می‌توانید فایل سریع (۱۰٬۰۰۰ ردیف نخست) یا اکسل کامل (پس‌زمینه) بگیرید.
                    </p>
                    <button
                      type="button"
                      onClick={handleTempExport}
                      disabled={isExporting || downloading}
                      className="group w-full flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-2xl
                                 text-[13px] font-semibold text-purple-800
                                 bg-white/90 backdrop-blur-sm
                                 border border-purple-200/70
                                 shadow-[0_2px_8px_rgba(88,28,135,0.08)]
                                 hover:bg-purple-50 hover:border-purple-300
                                 active:scale-[0.98]
                                 disabled:opacity-55 disabled:cursor-not-allowed
                                 transition-all duration-150"
                      title="سریع — فقط ۱۰٬۰۰۰ ردیف نخست"
                    >
                      {isExporting || downloading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          <span>در حال آماده‌سازی…</span>
                        </>
                      ) : (
                        <>
                          <ExcelIcon className="w-6 h-6 shrink-0" />
                          <span>اکسل سریع (۱۰٬۰۰۰ ردیف نخست)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!onExport || isExporting || downloading) return;
                        setDownloading(true);
                        try {
                          await onExport(message, { mode: 'create_full' });
                        } finally {
                          setDownloading(false);
                        }
                      }}
                      disabled={isExporting || downloading}
                      className="group w-full flex flex-col items-center justify-center gap-0.5 py-2.5 px-5 rounded-2xl
                                 text-[13px] font-semibold text-emerald-900
                                 bg-emerald-50/90 border border-emerald-200/80
                                 hover:bg-emerald-100 hover:border-emerald-300
                                 active:scale-[0.98]
                                 disabled:opacity-55 disabled:cursor-not-allowed
                                 transition-all duration-150"
                      title="کامل — در پس‌زمینه ساخته می‌شود؛ از «درخواست‌ها» پیگیری کنید"
                    >
                      <span className="flex items-center gap-2">
                        <ExcelIcon className="w-6 h-6 shrink-0" />
                        <span>
                          اکسل کامل (~{capEstimated.toLocaleString('fa-IR')} ردیف)
                        </span>
                      </span>
                      <span className="text-[10px] font-normal text-emerald-700/80">
                        زمان‌بر است — پس از آماده‌شدن در «درخواست‌ها» خبر می‌دهیم
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleTempExport}
                    disabled={isExporting || downloading}
                    className="group w-full flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-2xl
                               text-[13px] font-semibold text-purple-800
                               bg-white/90 backdrop-blur-sm
                               border border-purple-200/70
                               shadow-[0_2px_8px_rgba(88,28,135,0.08)]
                               hover:bg-purple-50 hover:border-purple-300
                               active:scale-[0.98]
                               disabled:opacity-55 disabled:cursor-not-allowed
                               transition-all duration-150"
                    title="ساخت فایل اکسل — حدود ۱۰ دقیقه فرصت دارید"
                  >
                    {isExporting || downloading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <span>در حال آماده‌سازی فایل…</span>
                      </>
                    ) : (
                      <>
                        <ExcelIcon className="w-6 h-6 shrink-0" />
                        <span>دریافت فایل اکسل</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Permanent file card — looks like an attachment, not a loud CTA */}
            {exportFiles.map((f, i) => (
              <button
                key={f.file_id || f.file_name || i}
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!onExport || downloading) return;
                  setDownloading(true);
                  try {
                    await onExport(
                      {
                        ...message,
                        metadata: {
                          ...meta,
                          export_file: f,
                          export_file_id: f.file_id,
                          export_file_name: f.file_name,
                          message_id: meta.message_id || message.id,
                        },
                      },
                      { mode: 'download' }
                    );
                  } finally {
                    setDownloading(false);
                  }
                }}
                disabled={downloading}
                className="w-full flex items-center gap-3 p-3 pr-3.5 rounded-2xl text-right
                           bg-white border border-emerald-100
                           shadow-[0_2px_10px_rgba(46,125,50,0.08)]
                           hover:border-emerald-300 hover:bg-emerald-50/40
                           active:scale-[0.99]
                           disabled:opacity-60
                           transition-all duration-150"
                title="دانلود از MinIO"
              >
                <div className="shrink-0">
                  <ExcelIcon className="w-10 h-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate leading-snug">
                    {f.file_name || fileName}
                  </p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">
                    {downloading ? 'در حال دریافت…' : 'فایل اکسل · کلیک برای دانلود'}
                  </p>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                  {downloading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}


        {showFeedback && (
          <div className="mt-2 w-full max-w-[340px]" dir="rtl">
            {!feedbackDone && !showDislikeBox && (
              <div className="rounded-2xl border border-purple-100 bg-white/90 px-3.5 py-3 shadow-sm">
                <p className="text-[12px] leading-relaxed text-purple-900/90 text-center mb-2.5">
                  همکار عزیز، نظرتان دربارهٔ کیفیت این پاسخ چیست؟
                  <br />
                  <span className="text-purple-500 text-[11px]">
                    اگر راضی بودید لایک کنید؛ اگر نه، خوشحال می‌شویم دلیلش را بنویسید.
                  </span>
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={feedbackBusy}
                    onClick={handleLike}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-xl
                               bg-emerald-50 border border-emerald-200
                               hover:bg-emerald-100 hover:scale-110
                               active:scale-95 transition disabled:opacity-50"
                    title="پسندیدم"
                    aria-label="like"
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    disabled={feedbackBusy}
                    onClick={handleDislikeClick}
                    className="w-11 h-11 flex items-center justify-center rounded-full text-xl
                               bg-rose-50 border border-rose-200
                               hover:bg-rose-100 hover:scale-110
                               active:scale-95 transition disabled:opacity-50"
                    title="نپسندیدم"
                    aria-label="dislike"
                  >
                    👎
                  </button>
                </div>
              </div>
            )}

            {!feedbackDone && showDislikeBox && (
              <div className="rounded-2xl border border-rose-100 bg-white px-3.5 py-3 shadow-sm">
                <p className="text-[12px] text-purple-900 mb-2 text-center">
                  چه چیزی می‌توانست بهتر باشد؟ <span className="text-purple-400">(اختیاری)</span>
                </p>
                <textarea
                  value={dislikeText}
                  onChange={(e) => setDislikeText(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="توضیح کوتاه…"
                  className="w-full text-[12px] rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
                  dir="rtl"
                />
                <div className="flex justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowDislikeBox(false); setFeedbackChoice(null); }}
                    className="px-3 py-1.5 text-[12px] rounded-full text-gray-600 hover:bg-gray-50"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    disabled={feedbackBusy}
                    onClick={handleDislikeSubmit}
                    className="px-4 py-1.5 text-[12px] font-medium rounded-full text-white bg-rose-500 hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition"
                  >
                    {feedbackBusy ? 'در حال ارسال…' : 'ارسال نظر'}
                  </button>
                </div>
              </div>
            )}

            {feedbackDone && (
              <p className="text-[11px] text-center text-purple-400/90 py-1">
                {feedbackChoice === 'like'
                  ? 'از بازخورد مثبت شما سپاسگزاریم 🌟'
                  : 'ممنون که نظرتان را نوشتید — در بهبود پاسخ‌ها کمک می‌کند'}
              </p>
            )}
          </div>
        )}

        <p
          className={`text-[11px] mt-1.5 px-2 text-purple-400/90 ${
            isMe ? 'self-end' : 'self-center'
          }`}
          dir="rtl"
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}