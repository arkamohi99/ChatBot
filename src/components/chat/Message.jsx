import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChartBlock from './ChartBlock';
import EntityPicker from './EntityPicker';
import Breadcrumb from './Breadcrumb';
import KpiTabBar from './KpiTabBar';

const EXPORT_TTL_MS = 10 * 60 * 1000;
const ALLOWED_CHART_TYPES = ['bar', 'line'];

const CHART_LABELS = {
  bar: 'نمودار میله‌ای',
  line: 'نمودار خطی',
};

// --- Icons ---
function ExcelIcon({ className = 'w-9 h-9' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <rect x="4" y="2" width="26" height="34" rx="3" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="1.5" />
      <path d="M10 10h14M10 16h14M10 22h14M10 28h8" stroke="#66BB6A" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="18" y="20" width="18" height="16" rx="2" fill="#2E7D32" />
      <text x="27" y="32" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">XLS</text>
    </svg>
  );
}
function BarIcon({ className = 'w-5 h-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" d="M4 20V10M10 20V4M16 20v-8M22 20V8" /></svg>;
}
function LineIcon({ className = 'w-5 h-5' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-8" /></svg>;
}
function ExpandIcon({ className = 'w-5 h-5' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
}
function CloseIcon({ className = 'w-6 h-6' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}

// --- Helpers ---
function resolveChartOptions(meta) {
  if (!meta || meta.needs_clarification === true) return [];
  const raw = meta.chart_options || meta.available_chart_types || meta.available_charts || meta.valid_chart_options || null;

  if (!Array.isArray(raw)) {
    if (typeof raw === 'string' && ALLOWED_CHART_TYPES.includes(raw.toLowerCase())) {
      const t = raw.toLowerCase();
      return [{ id: t, chart_type: t, scope: null, label_fa: CHART_LABELS[t], description_fa: '' }];
    }
    if (meta.chart_available === true || meta.charts_available === true) {
      return ALLOWED_CHART_TYPES.map((t) => ({ id: t, chart_type: t, scope: null, label_fa: CHART_LABELS[t], description_fa: '' }));
    }
    return [];
  }

  const seen = new Set();
  const out = [];
  for (const item of raw) {
    let opt;
    if (item && typeof item === 'object') {
      const ctype = String(item.chart_type || '').toLowerCase();
      opt = {
        id: String(item.id || ctype),
        chart_type: ctype,
        scope: item.scope || null,
        label_fa: item.label_fa || CHART_LABELS[ctype] || '',
        description_fa: item.description_fa || '',
        start_level: item.start_level || null,
      };
    } else {
      const t = String(item).toLowerCase();
      opt = { id: t, chart_type: t, scope: null, label_fa: CHART_LABELS[t] || '', description_fa: '' };
    }
    if (!ALLOWED_CHART_TYPES.includes(opt.chart_type)) continue;
    if (seen.has(opt.id)) continue;
    seen.add(opt.id);
    out.push(opt);
  }
  return out;
}

function groupChartOptionsByType(options) {
  const grouped = {};
  for (const t of ALLOWED_CHART_TYPES) grouped[t] = [];
  for (const opt of options) {
    if (grouped[opt.chart_type]) grouped[opt.chart_type].push(opt);
  }
  return grouped;
}

function trailLabelFor(level, value) {
  if (level === 'province') return `استان ${value}`;
  if (level === 'city') return `شهر ${value}`;
  if (level === 'branch') return `شعبه ${value}`;
  return value;
}

export default function Message({
  message,
  onExport,
  onReaction,
  onChart,
  onConfirmRowCap,
  onQuickReply,
  conversationId,
  exportingId,
  chartingId,
  confirmingRowCapId,
}) {
  const isMe = message.type === 'user' || message.type === 'me';
  const [downloading, setDownloading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [feedbackDone, setFeedbackDone] = useState(() => message.reaction === true || message.reaction === false);
  const [feedbackChoice, setFeedbackChoice] = useState(() => (message.reaction === true ? 'like' : message.reaction === false ? 'dislike' : null));
  const [showDislikeBox, setShowDislikeBox] = useState(false);
  const [dislikeText, setDislikeText] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  const [expandedChartType, setExpandedChartType] = useState(null);
  const [chartBusyId, setChartBusyId] = useState(null);
  const [entityTrail, setEntityTrail] = useState([]);
  const [activeKpiIndex, setActiveKpiIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const meta = message.metadata || {};
  const messageType = message.messageType || 'text';
  const text = message.text || '';
  const needsClarification = meta.needs_clarification === true;

  const idStr = String(message.id ?? '');
  const numericId = Number(message.id);
  const hasRealId = Number.isFinite(numericId) && numericId > 0 && !idStr.startsWith('bot-') && !idStr.startsWith('user-');

  const exportFile = meta.export_file;
  const hasPermanentFile = !needsClarification && (!!exportFile || meta.has_exportable_data === true || meta.export_file_id != null);

  const exportFiles = Array.isArray(meta.export_files) && meta.export_files.length
    ? meta.export_files
    : hasPermanentFile
      ? [{ file_name: exportFile?.file_name || meta.export_file_name || 'گزارش.xlsx', file_id: meta.export_file_id }]
      : [];

  const fileName = exportFile?.file_name || meta.export_file_name || 'گزارش.xlsx';
  const tableAvailable = !needsClarification && (meta.table_available === true || meta.export_ready_now === true);

  const createdAt = message.timestamp || Date.now();
  const stillWithinTtl = now - createdAt < EXPORT_TTL_MS;
  const dataCapped = meta.data_capped === true;
  const capLimit = Number(meta.data_cap_limit) || 10000;
  const capEstimated = Number(meta.data_cap_estimated) || 0;
  const offerFullExport = dataCapped && capEstimated > capLimit;

  const showTempExportBtn = !isMe && hasRealId && tableAvailable && stillWithinTtl && !hasPermanentFile;
  const isExporting = exportingId === message.id || exportingId === numericId;

  // Volume-guard confirmation (backend: needs_row_cap_confirmation +
  // clarification_type=VolumeConfirmation when estimated rows > 10k).
  const needsRowCapConfirm =
    !isMe &&
    hasRealId &&
    (meta.needs_row_cap_confirmation === true ||
      meta.clarification_type === 'VolumeConfirmation');
  const rowCapEstimated = Number(meta.row_cap_estimated_rows) || 0;
  const rowCapLimit = Number(meta.row_cap_limit) || 10000;
  const isConfirmingRowCap =
    confirmingRowCapId != null &&
    (String(confirmingRowCapId) === String(message.id) ||
      String(confirmingRowCapId) === String(meta.message_id));

  // Soft KPI suggestions must NOT become buttons. The narrative already lists
  // the candidate names; the user types the exact name or an ordinal
  // («اولی» / «دومی» / «1»). Backend still keeps offered_options in metadata
  // so triage can resolve those ordinals — UI does not render chips.
  // Volume-guard confirm has its own dedicated button path (needsRowCapConfirm).
  // Related-KPI follow-ups on a successful data answer also stay prose-only.
  const offeredOptions = Array.isArray(meta.offered_options)
    ? meta.offered_options.filter((o) => o && (o.kpi_name || o.label_fa))
    : [];
  const showOfferedOptions = false;

  const isMultiClause = meta.is_multi_clause === true;
  const resolvedClauses = Array.isArray(meta.resolved_clauses) ? meta.resolved_clauses : [];
  const kpiTabs = isMultiClause ? resolvedClauses.map((c) => ({ kpi_name: c.kpi_name || 'شاخص' })) : [];

  const chartOptions = resolveChartOptions(meta);
  const chartGroups = groupChartOptionsByType(chartOptions);
  const chartTypesPresent = ALLOWED_CHART_TYPES.filter((t) => chartGroups[t].length > 0);

  // Absolute cache indices written by backend when it pushed each clause
  // into QueryResultCache. Bare 0/1 clause positions are WRONG once the
  // conversation already has prior turns — charts then hit the wrong
  // entry and return "شعبه‌ای برای رسم نمودار روند مشخص نیست".
  const clauseCacheIndices = meta.clause_cache_indices || {};
  const resolveCacheIndex = (clauseIdx) => {
    const mapped = clauseCacheIndices[String(clauseIdx)];
    if (mapped != null && Number.isFinite(Number(mapped))) return Number(mapped);
    if (
      !isMultiClause &&
      meta.cached_result_index != null &&
      Number.isFinite(Number(meta.cached_result_index))
    ) {
      return Number(meta.cached_result_index);
    }
    return Number(clauseIdx) || 0;
  };
  // Reverse map: absolute cache index → clause position (0,1,…) so chart
  // replies keyed by absolute index still resolve the correct KPI label.
  const cacheIndexToClausePos = (() => {
    const rev = {};
    Object.entries(clauseCacheIndices).forEach(([pos, abs]) => {
      if (abs != null) rev[String(abs)] = Number(pos);
    });
    return rev;
  })();

  // 💡 FIX (BUG-NEW-9) — these are two different things and must not
  // share a source:
  //  - chartOptionsByClause: backend-emitted, per-clause list of
  //    available chart TYPES (bar_branches/line_scope/line_entity —
  //    button metadata, no `series`). Drives the picker buttons below.
  //  - chartRepliesByClause: frontend-populated (in ChatPanel's
  //    onChartReply) ONLY after a real chart_request round-trip —
  //    actual data with `series`. Drives what gets rendered.
  // Previously both lived under meta.charts_by_clause, so the option
  // stubs (present from the very first render, before any click) got
  // rendered as if they were fetched charts — permanently-empty chart
  // panels with no visible buttons, matching the reported screenshot.
  const chartOptionsByClause = meta.charts_by_clause || {};
  const chartRepliesByClause = meta.chart_replies_by_clause || {};

  // Multi-clause compare: surface charts together. When each clause is the
  // SAME KPI at a different place and each chart is a single-bar snapshot,
  // MERGE into ONE bar chart (locations on X) instead of N separate charts.
  const multiClauseChartEntries = (() => {
    if (!isMultiClause || !meta.is_comparison) return null;
    const entries = [];
    const keys = Object.keys(chartRepliesByClause);
    if (!keys.length) return null;
    keys
      .sort((a, b) => Number(a) - Number(b))
      .forEach((k) => {
        const slot = chartRepliesByClause[k];
        const list = Array.isArray(slot) ? slot : slot ? [slot] : [];
        const clausePos =
          cacheIndexToClausePos[String(k)] != null
            ? cacheIndexToClausePos[String(k)]
            : Number(k);
        const rc = resolvedClauses[clausePos] || {};
        const locs = Array.isArray(rc.locations)
          ? rc.locations
              .map((loc) => {
                if (!loc) return '';
                if (typeof loc === 'string') return loc;
                return (
                  loc.city_name ||
                  loc.province_name ||
                  loc.branch_name ||
                  loc.name ||
                  ''
                );
              })
              .filter(Boolean)
          : [];
        const label =
          locs.join(' و ') ||
          rc.kpi_name ||
          `شاخص ${Number.isFinite(clausePos) ? clausePos + 1 : k}`;
        list.forEach((c, i) => entries.push({ chart: c, label, key: `${k}-${i}` }));
      });

    if (entries.length < 2) return entries.length ? entries : null;

    // Merge single-value bar snapshots into one comparison chart.
    const canMerge = entries.every((e) => {
      const ch = e.chart || {};
      if (ch.chart_type && ch.chart_type !== 'bar') return false;
      const series = ch.series || [];
      if (!series.length) return false;
      // one series with at most one bucket, or N series each one bucket
      const vals = [];
      series.forEach((s) => {
        const b = s.buckets || [];
        if (b.length <= 1) {
          const v = b[0]?.value ?? s.value;
          if (v != null) vals.push(v);
        }
      });
      return vals.length === 1 || (series.length === 1 && (series[0].buckets || []).length <= 1);
    });

    if (canMerge) {
      const first = entries[0].chart || {};
      const mergedSeries = entries.map((e) => {
        const ch = e.chart || {};
        const series = ch.series || [];
        let value = null;
        if (series.length === 1 && (series[0].buckets || []).length) {
          value = series[0].buckets[0]?.value;
        } else if (series.length) {
          const b = series[0]?.buckets || [];
          value = b[0]?.value;
        }
        return {
          entity_name: e.label,
          buckets: [{ label: e.label, value }],
        };
      });
      const merged = {
        ...first,
        chart_type: 'bar',
        series: mergedSeries,
        title_fa:
          first.kpi_name ||
          meta.kpi_name ||
          first.title_fa ||
          'مقایسه مکان‌ها',
        option_id: 'bar_locations_merged',
      };
      return [{ chart: merged, label: 'مقایسه مکان‌ها', key: 'merged-locations' }];
    }

    return entries.length ? entries : null;
  })();

  const chartsList = (() => {
    if (multiClauseChartEntries) return multiClauseChartEntries.map((e) => e.chart);
    if (isMultiClause) {
      // Prefer clause-position key; also try absolute cache index for
      // replies stored by older ChatPanel builds.
      const absKey = String(resolveCacheIndex(activeKpiIndex));
      const slot =
        chartRepliesByClause[activeKpiIndex] ??
        chartRepliesByClause[String(activeKpiIndex)] ??
        chartRepliesByClause[absKey];
      if (Array.isArray(slot)) return slot;
      if (slot) return [slot];
      return [];
    }
    if (Array.isArray(meta.charts) && meta.charts.length) return meta.charts;
    const one = meta.chart || meta.chart_payload || message.chart || null;
    return one ? [one] : [];
  })();
  const chartPayload = chartsList.length ? chartsList[chartsList.length - 1] : null;
  const chartsLocked = meta.charts_locked === true || chartsList.length > 0;
  const isChartingThis = chartingId != null && (String(chartingId) === String(message.id) || String(chartingId) === String(meta.message_id));

  // Charts only in browser memory until reload. After first chart, lock buttons on this message.
  const showChartButtons =
    !isMe &&
    hasRealId &&
    !needsClarification &&
    chartTypesPresent.length > 0 &&
    typeof onChart === 'function' &&
    !chartsLocked;

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

  const handleChartOptionClick = async (option, trailEntry) => {
    if (!onChart || chartBusyId || isChartingThis) return;
    setChartBusyId(option.id);
    setExpandedChartType(null);
    try {
      if (isMultiClause && meta.is_comparison) {
        await Promise.all(
          resolvedClauses.map((_, idx) =>
            onChart(message, {
              ...option,
              clauseIndex: resolveCacheIndex(idx),
              clausePosition: idx,
            })
          )
        );
      } else {
        const pos = isMultiClause ? activeKpiIndex : 0;
        await onChart(message, {
          ...option,
          clauseIndex: resolveCacheIndex(pos),
          clausePosition: pos,
        });
      }
      if (trailEntry) setEntityTrail((prev) => [...prev, trailEntry]);
    } finally {
      setChartBusyId(null);
    }
  };

  const handleBreadcrumbNavigate = async (target) => {
    if (!onChart || chartBusyId || isChartingThis) return;
    if (target === null) {
      setEntityTrail([]);
      const fallback = chartGroups.line?.find((o) => o.id === 'line_scope') || chartGroups.line?.[0];
      if (fallback) {
        setChartBusyId(fallback.id);
        try {
          if (isMultiClause && meta.is_comparison) {
            await Promise.all(
              resolvedClauses.map((_, idx) =>
                onChart(message, {
                  ...fallback,
                  clauseIndex: resolveCacheIndex(idx),
                  clausePosition: idx,
                })
              )
            );
          } else {
            const pos = isMultiClause ? activeKpiIndex : 0;
            await onChart(message, {
              ...fallback,
              clauseIndex: resolveCacheIndex(pos),
              clausePosition: pos,
            });
          }
        } finally {
          setChartBusyId(null);
        }
      }
      return;
    }
    const idx = entityTrail.findIndex((t) => t === target);
    const truncated = idx >= 0 ? entityTrail.slice(0, idx + 1) : entityTrail;
    setEntityTrail(truncated);
    setChartBusyId('line_entity');
    try {
      const base = {
        id: 'line_entity',
        chart_type: 'line',
        chart_option_id: 'line_entity',
        entity_level: target.level,
        entity_value: target.entity_value,
      };
      if (isMultiClause && meta.is_comparison) {
        await Promise.all(
          resolvedClauses.map((_, clauseIdx) =>
            onChart(message, {
              ...base,
              clauseIndex: resolveCacheIndex(clauseIdx),
              clausePosition: clauseIdx,
            })
          )
        );
      } else {
        const pos = isMultiClause ? activeKpiIndex : 0;
        await onChart(message, {
          ...base,
          clauseIndex: resolveCacheIndex(pos),
          clausePosition: pos,
        });
      }
    } finally {
      setChartBusyId(null);
    }
  };

  const handleChartTypeClick = (ctype) => {
    const opts = chartGroups[ctype];
    if (!opts || opts.length === 0) return;
    if (opts.length === 1) {
      handleChartOptionClick(opts[0]);
      return;
    }
    // Prefer aggregate city/scope trend over multi-branch overlay when both
    // exist — avoids the "108 series of dots" chart on تهران comparisons.
    if (ctype === 'line') {
      const scopeOpt = opts.find((o) => o.id === 'line_scope');
      if (scopeOpt) {
        handleChartOptionClick(scopeOpt);
        return;
      }
    }
    setExpandedChartType((prev) => (prev === ctype ? null : ctype));
  };

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
  const handleDislikeClick = () => { setShowDislikeBox(true); setFeedbackChoice('dislike'); };
  const handleDislikeSubmit = () => { submitReaction(false, dislikeText.trim() || null); };
  const handleKpiTabSelect = (idx) => { setActiveKpiIndex(idx); setEntityTrail([]); };

  const showFeedback = !isMe && hasRealId && messageType !== 'balance' && typeof onReaction === 'function' && conversationId != null;
  const showActions = !isMe && (needsRowCapConfirm || showOfferedOptions || showTempExportBtn || hasPermanentFile || showFeedback || showChartButtons || chartsList.length > 0 || (isMultiClause && meta.is_comparison && Object.keys(chartOptionsByClause).length > 0));

  const renderChartArea = (fullscreen = false) => {
    if (!chartsList.length) return null;
    return (
      <div className={`w-full flex flex-col gap-4 ${fullscreen ? 'h-[85vh] overflow-auto' : ''}`}>
        <p className="text-[11px] text-amber-700/90 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center" dir="rtl">
          نمودارها فقط تا رفرش صفحه یا ترک گفتگو در مرورگر می‌مانند.
          قبل از بستن صفحه، از نوار ابزار نمودار (آیکون دانلود) تصویر را ذخیره کنید.
        </p>
        {chartsList.map((c, i) => (
          <div
            key={c._client_id || c.option_id || `chart-${i}`}
            className={`w-full ${fullscreen ? 'min-h-[70vh]' : 'min-h-[480px] h-[520px]'}`}
          >
            <ChartBlock chart={c} meta={meta} isFullscreen={fullscreen} />
          </div>
        ))}
      </div>
    );
  };
  return (
    <>
      {/* FULLSCREEN MODAL OVERLAY */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col p-4 md:p-8 animate-in fade-in duration-200" dir="rtl">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setIsFullscreen(false)} 
              className="text-white hover:text-rose-400 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all flex items-center justify-center"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="flex-1 bg-gray-50 rounded-[2rem] p-4 md:p-8 shadow-2xl overflow-hidden flex flex-col">
            {renderChartArea(true)}
          </div>
        </div>
      )}

      {/* NORMAL MESSAGE FLOW */}
      <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-6`} dir="ltr">
        {!isMe && (
          <div className="w-10 h-10 mr-3 rounded-full bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center text-white font-bold text-sm leading-tight flex-shrink-0 shadow-md">
            EN
            <br />
            <small className="text-[9px] opacity-90">AI</small>
          </div>
        )}

        <div className={`max-w-[1100px] w-full flex flex-col ${isMe ? 'items-end' : 'items-center'}`}>
          <div
            className={`w-full px-5 py-3.5 text-[15px] leading-relaxed shadow-sm text-right
              ${
                isMe
                  ? 'bg-indigo-800 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white border border-gray-100/80 text-indigo-950 rounded-2xl rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              }`}
            dir="rtl"
          >
            {isMe && messageType !== 'balance' && <p className="whitespace-pre-line">{text}</p>}

            {!isMe && messageType !== 'balance' && (
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <div className="my-3 overflow-auto max-h-[380px] rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-sm border-collapse" {...props}>{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-indigo-50 text-indigo-900 sticky top-0 z-10">{children}</thead>,
                    th: ({ children }) => <th className="px-4 py-2.5 text-right font-semibold border-b border-indigo-200">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-2 text-right border-b border-gray-100">{children}</td>,
                    strong: ({ children }) => <strong className="font-bold text-indigo-950">{children}</strong>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )}

            {messageType === 'balance' && (
              <>
                <p className="text-3xl font-black text-indigo-800">{message.amount}</p>
                <p className="text-xs text-indigo-600 mt-2">{message.sub}</p>
              </>
            )}
          </div>

          {/* KPI tabs only when multi-clause is NOT a side-by-side compare
              (compare already shows every clause's chart stacked below). */}
          {!isMe && isMultiClause && kpiTabs.length > 1 && !meta.is_comparison && (
            <div className="mt-2.5 w-full">
              <KpiTabBar kpis={kpiTabs} activeIndex={activeKpiIndex} onSelect={handleKpiTabSelect} />
            </div>
          )}

          {!isMe && chartPayload && entityTrail.length > 0 && (
            <div className="mt-1 w-full">
              <Breadcrumb trail={entityTrail} onNavigate={handleBreadcrumbNavigate} />
            </div>
          )}

          {!isMe && multiClauseChartEntries && multiClauseChartEntries.length > 0 && (
            <div className="mt-4 w-full relative group flex flex-col gap-4">
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="bg-white border border-gray-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 py-2 px-3 rounded-xl shadow-sm flex items-center gap-2 text-[12px] font-bold transition-all active:scale-95"
                  title="نمایش تمام صفحه"
                >
                  <ExpandIcon />
                  <span>تمام‌صفحه</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-700/90 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-center" dir="rtl">
                نمودارها فقط تا رفرش صفحه در مرورگر می‌مانند — قبل از بستن، تصویر را از نوار ابزار نمودار ذخیره کنید.
              </p>
              {multiClauseChartEntries.map((entry) => (
                <div key={entry.key} className="w-full">
                  <p className="text-[12px] font-bold text-indigo-800 mb-1.5 text-right px-1" dir="rtl">
                    {entry.label}
                  </p>
                  {/* min-h not fixed h — fixed 450px was clipping rotated x-axis labels */}
                  <div className="w-full min-h-[480px] h-[520px]">
                    <ChartBlock chart={entry.chart} meta={meta} isFullscreen={false} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isMe && !multiClauseChartEntries && chartsList.length > 0 && (
            <div className="mt-4 w-full relative group">
              <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="bg-white border border-gray-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 py-2 px-3 rounded-xl shadow-sm flex items-center gap-2 text-[12px] font-bold transition-all active:scale-95"
                  title="نمایش تمام صفحه"
                >
                  <ExpandIcon />
                  <span>تمام‌صفحه</span>
                </button>
              </div>
              {renderChartArea(false)}
            </div>
          )}

          {showActions && (
            <div className="mt-3.5 flex flex-col items-center gap-2 w-full max-w-[320px]" dir="rtl">
              {needsRowCapConfirm && typeof onConfirmRowCap === 'function' && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-[11px] text-center text-amber-800/90 leading-relaxed px-1 bg-amber-50 border border-amber-100 rounded-xl py-2">
                    حجم داده حدود{' '}
                    <strong>{(rowCapEstimated || 0).toLocaleString('fa-IR')}</strong>{' '}
                    ردیف است (سقف {(rowCapLimit || 10000).toLocaleString('fa-IR')}).
                    با تأیید، {(rowCapLimit || 10000).toLocaleString('fa-IR')} ردیف نخست نمایش داده می‌شود.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isConfirmingRowCap) return;
                      onConfirmRowCap(message);
                    }}
                    disabled={isConfirmingRowCap}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-[13px] font-semibold text-white bg-indigo-700 border border-indigo-800 shadow-sm hover:bg-indigo-800 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed transition-all"
                  >
                    {isConfirmingRowCap ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>در حال آماده‌سازی گزارش…</span>
                      </>
                    ) : (
                      <span>
                        بله، {(rowCapLimit || 10000).toLocaleString('fa-IR')} ردیف نخست را نشان بده
                      </span>
                    )}
                  </button>
                </div>
              )}

              {showOfferedOptions && (
                <div className="w-full flex flex-col gap-1.5">
                  <p className="text-[11px] text-center text-indigo-500/90">می‌توانید یکی از این‌ها را انتخاب کنید:</p>
                  {offeredOptions.map((opt, i) => {
                    const label = opt.kpi_name || opt.label_fa || `گزینه ${opt.index || i + 1}`;
                    return (
                      <button
                        key={`opt-${opt.index || i}-${label}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onQuickReply(label);
                        }}
                        className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 active:scale-[0.98] transition-all"
                      >
                        {opt.index != null ? `${opt.index}. ${label}` : label}
                      </button>
                    );
                  })}
                </div>
              )}

              {chartsLocked && (
                <p className="w-full text-center text-[11px] text-indigo-500/90 py-1" dir="rtl">
                  نمودار این پیام ساخته شده — برای نمودار دیگر پیام جدیدی بپرسید.
                  پیش از رفرش صفحه، تصویر را از نوار ابزار نمودار دانلود کنید.
                </p>
              )}

              {showChartButtons && (
                <div className="w-full flex flex-col gap-2">
                  <div className="w-full flex gap-2">
                    {chartTypesPresent.map((ctype) => {
                      const opts = chartGroups[ctype];
                      const busy = opts.some((o) => o.id === chartBusyId) || isChartingThis;
                      const Icon = ctype === 'line' ? LineIcon : BarIcon;
                      const isExpanded = expandedChartType === ctype;
                      return (
                        <button
                          key={ctype}
                          type="button"
                          onClick={() => handleChartTypeClick(ctype)}
                          disabled={busy}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl
                                     text-[12px] font-semibold text-indigo-900 border
                                     active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed
                                     transition-all duration-150
                                     ${
                                       isExpanded
                                         ? 'bg-indigo-100 border-indigo-300'
                                         : 'bg-indigo-50/90 border-indigo-200/80 hover:bg-indigo-100 hover:border-indigo-300'
                                     }`}
                        >
                          {busy ? <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Icon className="w-4 h-4 shrink-0" />}
                          <span>{CHART_LABELS[ctype]}</span>
                          {opts.length > 1 && <span className="text-[10px] opacity-60">({opts.length})</span>}
                        </button>
                      );
                    })}
                  </div>


                  {expandedChartType && chartGroups[expandedChartType].length > 1 && (
                    <div className="w-full flex flex-col gap-1.5 pr-1 border-r-2 border-indigo-100" dir="rtl">
                      {chartGroups[expandedChartType].map((opt) =>
                        opt.id === 'line_entity' ? (
                          <EntityPicker
                            key="line_entity"
                            hierarchy={meta.chart_entity_hierarchy || []}
                            startLevel={opt.start_level || 'province'}
                            presetProvince={meta.chart_scope_hint?.province_name || null}
                            presetCity={meta.chart_scope_hint?.city_name || null}
                            busy={chartBusyId != null || isChartingThis}
                            onPick={(sel) => handleChartOptionClick({ ...opt, ...sel }, { level: sel.entity_level, entity_value: sel.entity_value, label: trailLabelFor(sel.entity_level, sel.entity_value) })}
                          />
                        ) : (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleChartOptionClick(opt)}
                            disabled={chartBusyId === opt.id || isChartingThis}
                            className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed transition-all duration-150"
                          >
                            {chartBusyId === opt.id || isChartingThis ? 'در حال ساخت نمودار…' : opt.label_fa}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {showTempExportBtn && (
                <div className="w-full flex flex-col gap-2">
                  {offerFullExport ? (
                    <>
                      <p className="text-[11px] text-center text-indigo-500/90 leading-relaxed px-1">
                        حجم داده حدود <strong>{capEstimated.toLocaleString('fa-IR')}</strong> ردیف است.
                        می‌توانید فایل سریع (۱۰٬۰۰۰ ردیف نخست) یا اکسل کامل (پس‌زمینه) بگیرید.
                      </p>
                      <button type="button" onClick={handleTempExport} disabled={isExporting || downloading} className="group w-full flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-2xl text-[13px] font-semibold text-indigo-800 bg-white/90 backdrop-blur-sm border border-indigo-200/70 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed transition-all">
                        {isExporting || downloading ? <><span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /><span>در حال آماده‌سازی…</span></> : <><ExcelIcon className="w-6 h-6 shrink-0" /><span>اکسل سریع (۱۰٬۰۰۰ ردیف نخست)</span></>}
                      </button>
                      <button type="button" onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!onExport || isExporting || downloading) return; setDownloading(true); try { await onExport(message, { mode: 'create_full' }); } finally { setDownloading(false); } }} disabled={isExporting || downloading} className="group w-full flex flex-col items-center justify-center gap-0.5 py-2.5 px-5 rounded-2xl text-[13px] font-semibold text-emerald-900 bg-emerald-50/90 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed transition-all">
                        <span className="flex items-center gap-2"><ExcelIcon className="w-6 h-6 shrink-0" /><span>اکسل کامل (~{capEstimated.toLocaleString('fa-IR')} ردیف)</span></span>
                        <span className="text-[10px] font-normal text-emerald-700/80">زمان‌بر است — پس از آماده‌شدن در «درخواست‌ها» خبر می‌دهیم</span>
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={handleTempExport} disabled={isExporting || downloading} className="group w-full flex items-center justify-center gap-2.5 py-2.5 px-5 rounded-2xl text-[13px] font-semibold text-indigo-800 bg-white/90 backdrop-blur-sm border border-indigo-200/70 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed transition-all">
                      {isExporting || downloading ? <><span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /><span>در حال آماده‌سازی فایل…</span></> : <><ExcelIcon className="w-6 h-6 shrink-0" /><span>دریافت فایل اکسل</span></>}
                    </button>
                  )}
                </div>
              )}

              {exportFiles.map((f, i) => (
                <button
                  key={f.file_id || f.file_name || i}
                  type="button"
                  onClick={async (e) => { e.preventDefault(); e.stopPropagation(); if (!onExport || downloading) return; setDownloading(true); try { await onExport({ ...message, metadata: { ...meta, export_file: f, export_file_id: f.file_id, export_file_name: f.file_name, message_id: meta.message_id || message.id } }, { mode: 'download' }); } finally { setDownloading(false); } }}
                  disabled={downloading}
                  className="w-full flex items-center gap-3 p-3 pr-3.5 rounded-2xl text-right bg-white border border-emerald-100 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/40 active:scale-[0.99] disabled:opacity-60 transition-all"
                >
                  <div className="shrink-0"><ExcelIcon className="w-10 h-10" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate leading-snug">{f.file_name || fileName}</p>
                    <p className="text-[11px] text-emerald-700/80 mt-0.5">{downloading ? 'در حال دریافت…' : 'فایل اکسل · کلیک برای دانلود'}</p>
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                    {downloading ? <span className="inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showFeedback && (
            <div className="mt-2 w-full max-w-[340px]" dir="rtl">
              {!feedbackDone && !showDislikeBox && (
                <div className="rounded-2xl border border-indigo-100 bg-white/90 px-3.5 py-3 shadow-sm">
                  <p className="text-[12px] leading-relaxed text-indigo-900/90 text-center mb-2.5">
                    همکار عزیز، نظرتان دربارهٔ کیفیت این پاسخ چیست؟<br />
                    <span className="text-indigo-500 text-[11px]">اگر راضی بودید لایک کنید؛ اگر نه، خوشحال می‌شویم دلیلش را بنویسید.</span>
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <button type="button" disabled={feedbackBusy} onClick={handleLike} className="w-11 h-11 flex items-center justify-center rounded-full text-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:scale-110 active:scale-95 transition disabled:opacity-50">👍</button>
                    <button type="button" disabled={feedbackBusy} onClick={handleDislikeClick} className="w-11 h-11 flex items-center justify-center rounded-full text-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:scale-110 active:scale-95 transition disabled:opacity-50">👎</button>
                  </div>
                </div>
              )}

              {!feedbackDone && showDislikeBox && (
                <div className="rounded-2xl border border-rose-100 bg-white px-3.5 py-3 shadow-sm">
                  <p className="text-[12px] text-indigo-900 mb-2 text-center">چه چیزی می‌توانست بهتر باشد؟ <span className="text-indigo-400">(اختیاری)</span></p>
                  <textarea value={dislikeText} onChange={(e) => setDislikeText(e.target.value)} rows={3} maxLength={2000} placeholder="توضیح کوتاه…" className="w-full text-[12px] rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300" dir="rtl" />
                  <div className="flex justify-center gap-2 mt-2">
                    <button type="button" onClick={() => { setShowDislikeBox(false); setFeedbackChoice(null); }} className="px-3 py-1.5 text-[12px] rounded-full text-gray-600 hover:bg-gray-50">انصراف</button>
                    <button type="button" disabled={feedbackBusy} onClick={handleDislikeSubmit} className="px-4 py-1.5 text-[12px] font-medium rounded-full text-white bg-rose-500 hover:bg-rose-600 active:scale-95 disabled:opacity-50 transition">{feedbackBusy ? 'در حال ارسال…' : 'ارسال نظر'}</button>
                  </div>
                </div>
              )}

              {feedbackDone && (
                <p className="text-[11px] text-center text-indigo-400/90 py-1">{feedbackChoice === 'like' ? 'از بازخورد مثبت شما سپاسگزاریم 🌟' : 'ممنون که نظرتان را نوشتید — در بهبود پاسخ‌ها کمک می‌کند'}</p>
              )}
            </div>
          )}

          <p className={`text-[11px] mt-1.5 px-2 text-indigo-400/90 ${isMe ? 'self-end' : 'self-center'}`} dir="rtl">
            {message.time}
          </p>
        </div>
      </div>
    </>
  );
}