import React from 'react';
import Chart from 'react-apexcharts';

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/**
 * Professional banking dashboard palette — reordered so adjacent series
 * (index i vs i+1, the order Apex actually assigns colors in) alternate
 * warm/cool hue families instead of clustering blues together (the old
 * order put blue/cyan/indigo at positions 0/5/8, which is exactly the
 * "can't tell series apart" complaint on crowded line charts).
 */
const PALETTE = [
  '#2563EB', // blue
  '#F97316', // orange
  '#10B981', // emerald
  '#DB2777', // rose
  '#7C3AED', // violet
  '#EAB308', // gold
  '#0EA5E9', // sky
  '#DC2626', // red
  '#65A30D', // olive
  '#A855F7', // purple
  '#0D9488', // teal
  '#EA580C', // burnt orange
];

// Secondary, non-color encoding for line charts once series count grows
// past what a 12-color palette can keep visually distinct at a glance.
// Solid / dashed / dotted repeating every 3rd series — a standard trick
// so two series that land on similar hues (or similar values, sitting
// close together on the same y-range) are still separable by pattern.
const DASH_PATTERNS = [0, 6, 2];
function buildDashArray(count) {
  return Array.from({ length: count }, (_, i) => DASH_PATTERNS[i % DASH_PATTERNS.length]);
}

const MAX_SERIES = 8;
const MAX_CATEGORIES = 24;

function formatTimeLabel(label, unit) {
  if (!label || typeof label !== 'string') return label;
  const parts = label.split(/[/\-T]/);
  if (unit === 'month') {
    // Full "YYYY/MM" (2 parts) or year-stripped "MM" (1 part — see
    // chart_series_merger.strip_leading_year_from_label, which runs on
    // every comparison chart before this label ever reaches here).
    const yearPart = parts.length >= 2 ? parts[0] : null;
    const mPart = parts.length >= 2 ? parts[1] : parts[0];
    const mIndex = parseInt(mPart, 10) - 1;
    const monthName = JALALI_MONTHS[mIndex] || mPart;
    return yearPart ? `${monthName} ${yearPart}` : monthName;
  }
  if (unit === 'day') {
    // Full "YYYY/MM/DD" (3 parts) or year-stripped "MM/DD" (2 parts).
    const mPart = parts.length >= 3 ? parts[1] : parts[0];
    const dPart = parts.length >= 3 ? parts[2] : parts[1];
    const mIndex = parseInt(mPart, 10) - 1;
    return `${parseInt(dPart, 10)} ${JALALI_MONTHS[mIndex] || mPart}`;
  }
  if (unit === 'year' && parts.length >= 1) return parts[0];
  return label;
}

function toFaNumber(n) {
  if (typeof n !== 'number') {
    const parsed = typeof n === 'string' && n.trim() !== '' ? Number(n) : NaN;
    if (Number.isNaN(parsed)) return n ?? '—';
    n = parsed;
  }
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}B`;
  if (abs >= 1e6) return `${(n / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1e3) return `${(n / 1e3).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}K`;
  return Number(n).toLocaleString('fa-IR', { maximumFractionDigits: 1 });
}

function toFaFull(n) {
  if (n == null || Number.isNaN(n)) return 'بدون داده';
  return Number(n).toLocaleString('fa-IR', { maximumFractionDigits: 2 });
}
function labelSortKey(label) {
  if (!label || typeof label !== 'string') return [0, 0, 0];
  const s = label.trim();
  const sep = s.includes('/') ? '/' : s.includes('-') ? '-' : null;
  if (!sep) return [0, 0, 0];
  const parts = s.split('T')[0].split(sep).map((p) => parseInt(p, 10));
  const [y, m, d] = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  return [y, m, d];
}

function compareLabels(a, b) {
  const ka = labelSortKey(a);
  const kb = labelSortKey(b);
  for (let i = 0; i < 3; i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return 0;
}
function truncateLabel(label, max = 16) {
  if (!label || typeof label !== 'string') return label || 'نامشخص';
  return label.length > max ? `${label.slice(0, max)}…` : label;
}

// --- KPI summary strip -----------------------------------------------
// The reference dashboards (production-style KPI boards) never show a
// bare chart — there's always a row of headline numbers above it
// (latest value, trend, min/max, total). We don't have gauge widgets in
// this product (bar/line only), so this strip is the stand-in: derived
// straight from the same series data the chart already renders, no
// extra backend call.
function TrendArrow({ up, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      {up ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M18 6H9M18 6v9" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 18H9M18 18V9" />
      )}
    </svg>
  );
}

function computeChartStats(chart) {
  const { chart_type, series = [], scale = 1 } = chart;
  const flat = [];
  series.forEach((s) => s.buckets?.forEach((b) => { if (b.value != null) flat.push(b.value / scale); }));
  if (!flat.length) return null;

  const sum = flat.reduce((a, b) => a + b, 0);
  const avg = sum / flat.length;
  const max = Math.max(...flat);
  const min = Math.min(...flat);

  const chips = [];

  // Single-series line/area → headline is "latest value" + trend vs. the
  // start of the range, which is the number a manager actually scans for.
  if (chart_type === 'line' && series.length === 1) {
    const vals = (series[0].buckets || [])
      .map((b) => (b.value != null ? b.value / scale : null))
      .filter((v) => v != null);
    if (vals.length) {
      const last = vals[vals.length - 1];
      chips.push({ label: 'آخرین مقدار', value: toFaNumber(last), tone: 'primary' });
    }
    if (vals.length >= 2) {
      const first = vals[0];
      const last = vals[vals.length - 1];
      const delta = last - first;
      const pct = first !== 0 ? (delta / Math.abs(first)) * 100 : null;
      chips.push({
        label: 'تغییر نسبت به ابتدای بازه',
        value: `${toFaNumber(Math.abs(delta))}${pct != null ? ` (${pct >= 0 ? '+' : '−'}${Math.abs(pct).toLocaleString('fa-IR', { maximumFractionDigits: 1 })}٪)` : ''}`,
        trend: delta >= 0 ? 'up' : 'down',
      });
    }
    chips.push({ label: 'بیشترین', value: toFaNumber(max) });
    chips.push({ label: 'کمترین', value: toFaNumber(min) });
    return chips;
  }

  // Multi-series line (comparison) → nothing meaningfully "headline" per
  // series, so keep it to range-level context instead of picking a winner.
  if (chart_type === 'line') {
    chips.push({ label: 'تعداد روند', value: toFaNumber(series.length) });
    chips.push({ label: 'بیشترین مقدار ثبت‌شده', value: toFaNumber(max) });
    chips.push({ label: 'کمترین مقدار ثبت‌شده', value: toFaNumber(min) });
    return chips;
  }

  // Bar snapshot (one value per entity) → sum/avg/top performer read like
  // the "Net Revenue" style KPI cards in the reference boards.
  const isSnapshot = series.every((s) => (s.buckets?.length || 0) <= 1);
  if (isSnapshot) {
    let top = null;
    series.forEach((s) => {
      const v = s.buckets?.[0]?.value;
      if (v != null) {
        const scaled = v / scale;
        if (!top || Math.abs(scaled) > Math.abs(top.value)) top = { name: s.entity_name, value: scaled };
      }
    });
    chips.push({ label: 'مجموع', value: toFaNumber(sum), tone: 'primary' });
    chips.push({ label: 'میانگین', value: toFaNumber(avg) });
    if (top) chips.push({ label: 'بیشترین', value: `${toFaNumber(top.value)} · ${truncateLabel(top.name, 14)}` });
    chips.push({ label: 'تعداد واحد', value: toFaNumber(series.length) });
    return chips;
  }

  // Grouped / matrix bar comparison → range-level context only.
  chips.push({ label: 'میانگین کل', value: toFaNumber(avg), tone: 'primary' });
  chips.push({ label: 'بیشترین', value: toFaNumber(max) });
  chips.push({ label: 'کمترین', value: toFaNumber(min) });
  return chips;
}

function StatChipRow({ chips, accent }) {
  if (!chips || !chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-5 pb-3.5" dir="rtl">
      {chips.map((c, i) => (
        <div
          key={i}
          className={`flex flex-col gap-0.5 rounded-xl px-3 py-1.5 min-w-[92px] border ${
            c.tone === 'primary' ? 'border-transparent' : 'bg-slate-50 border-slate-100'
          }`}
          style={c.tone === 'primary' ? { backgroundColor: `${accent}12`, borderColor: `${accent}30` } : undefined}
        >
          <span className="text-[12px] font-bold text-slate-600 leading-none tracking-wide">{c.label}</span>
          <span
            className={`text-[16px] font-black leading-tight flex items-center gap-1 tabular-nums ${
              c.trend === 'up' ? 'text-emerald-600' : c.trend === 'down' ? 'text-rose-600' : ''
            }`}
            style={!c.trend ? { color: c.tone === 'primary' ? accent : '#0F172A' } : undefined}
          >
            {c.trend && <TrendArrow up={c.trend === 'up'} />}
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message = 'داده‌ای برای نمایش نمودار موجود نیست.' }) {
  return (
    <div className="w-full min-h-[240px] flex flex-col items-center justify-center gap-3 text-slate-400" dir="rtl">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
        <svg className="w-7 h-7 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V9m6 8V5M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-[13px] font-medium text-slate-500">{message}</p>
    </div>
  );
}

function ChartShell({ title, subtitle, note, children, footnote, accent = '#2563EB', stats = null }) {
  return (
    <div
      className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden"
      dir="ltr"
    >
      {(title || subtitle) && (
        <div
          className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-slate-100"
          dir="rtl"
          style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(255,255,255,0) 100%)' }}
        >
          <span
            className="shrink-0 rounded-full"
            style={{ width: 8, height: 8, backgroundColor: accent, boxShadow: `0 0 0 4px ${accent}22` }}
          />
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-[17px] font-black text-slate-900 tracking-tight leading-snug truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[13px] text-slate-600 mt-0.5 font-bold">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      {stats && <StatChipRow chips={stats} accent={accent} />}
      {note && (
        <p className="text-[11.5px] text-amber-800 bg-amber-50 border-b border-amber-100 px-4 py-2 text-center font-medium" dir="rtl">
          {note}
        </p>
      )}
      <div className="flex-1 min-h-0 px-3 pt-3 pb-1">{children}</div>
      {footnote && (
        <p className="text-center text-[10.5px] text-slate-400 pb-3 px-4 pt-1" dir="rtl">
          {footnote}
        </p>
      )}
    </div>
  );
}

const FONT = '"IRANSansX", "IRANSans", Vazirmatn, "Segoe UI", Tahoma, system-ui, sans-serif';

const BASE_CHART = {
  fontFamily: FONT,
  background: 'transparent',
  toolbar: {
    show: true,
    offsetY: 0,
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
    },
    export: {
      csv: { headerCategory: 'برچسب' },
    },
  },
  zoom: { enabled: true },
  animations: {
    enabled: true,
    easing: 'easeinout',
    speed: 450,
    animateGradually: { enabled: true, delay: 80 },
  },
  dropShadow: { enabled: false },
};

const GRID = {
  borderColor: '#E2E8F0',
  strokeDashArray: 4,
  xaxis: { lines: { show: false } },
  yaxis: { lines: { show: true } },
  // bottom must leave room for rotated Persian month labels — bottom:0 was
  // clipping the entire x-axis on year-long line charts (screenshot).
  padding: { top: 10, right: 14, bottom: 36, left: 10 },
};

const TOOLTIP = {
  theme: 'light',
  style: { fontSize: '13.5px', fontFamily: FONT },
  marker: { show: true },
  fillSeriesColor: false,
};

const LEGEND = {
  position: 'top',
  horizontalAlign: 'center',
  floating: false,
  fontSize: '13px',
  fontFamily: FONT,
  fontWeight: 600,
  markers: { width: 9, height: 9, radius: 2, offsetX: -2 },
  itemMargin: { horizontal: 12, vertical: 4 },
  onItemClick: { toggleDataSeries: true },
  onItemHover: { highlightDataSeries: true },
};

/**
 * Snapshot bar payloads often arrive as N series × 1 bucket (one per branch).
 * That produces a useless multi-color legend. Flatten to 1 series × N categories.
 * Comparison bars (N series × M shared categories) stay grouped.
 */
function normalizeBarData(series, scale, kpiName) {
  if (!series?.length) {
    return { categories: [], apexSeries: [], cappedNote: null, mode: 'empty' };
  }

  const singleBucketEach = series.every((s) => (s.buckets?.length || 0) <= 1);
  const sharedLabels =
    !singleBucketEach &&
    series.length > 1 &&
    series.every(
      (s) =>
        (s.buckets?.length || 0) === (series[0].buckets?.length || 0) &&
        (s.buckets || []).every((b, i) => b.label === series[0].buckets[i]?.label)
    );

  // Case A: snapshot — one value per entity → categorical bar
  if (singleBucketEach) {
    let rows = series.map((s) => ({
      name: s.entity_name || s.buckets?.[0]?.label || 'نامشخص',
      value: s.buckets?.[0]?.value != null ? s.buckets[0].value / scale : null,
    }));

    let cappedNote = null;
    if (rows.length > MAX_CATEGORIES) {
      rows = [...rows]
        .sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0))
        .slice(0, MAX_CATEGORIES);
      cappedNote = `نمایش ${MAX_CATEGORIES} مورد برتر از ${series.length} مورد`;
    }

    return {
      categories: rows.map((r) => r.name),
      apexSeries: [
        {
          name: kpiName || 'مقدار',
          data: rows.map((r) => r.value),
        },
      ],
      cappedNote,
      mode: 'snapshot',
    };
  }

  // Case B: grouped / comparison — series = periods (or groups), buckets = entities
  let categories = (series[0]?.buckets || []).map((b) => b.label);
  let working = series;
  let cappedNote = null;

  if (categories.length > MAX_CATEGORIES) {
    const idxRanked = categories
      .map((_, i) => i)
      .sort((a, b) => {
        const av = Math.abs(working[0]?.buckets?.[a]?.value ?? 0);
        const bv = Math.abs(working[0]?.buckets?.[b]?.value ?? 0);
        return bv - av;
      })
      .slice(0, MAX_CATEGORIES);
    cappedNote = `نمایش ${MAX_CATEGORIES} مورد برتر از ${categories.length} مورد`;
    categories = idxRanked.map((i) => categories[i]);
    working = working.map((s) => ({
      ...s,
      buckets: idxRanked.map((i) => s.buckets[i]),
    }));
  }

  if (working.length > MAX_SERIES) {
    cappedNote = [
      cappedNote,
      `نمایش ${MAX_SERIES} سری از ${working.length}`,
    ]
      .filter(Boolean)
      .join(' · ');
    working = working.slice(0, MAX_SERIES);
  }

  return {
    categories,
    apexSeries: working.map((s) => ({
      name: s.entity_name || 'سری',
      data: (s.buckets || []).map((b) => (b.value != null ? b.value / scale : null)),
    })),
    cappedNote,
    mode: sharedLabels ? 'grouped' : 'matrix',
  };
}

export default function ChartBlock({ chart, meta, isFullscreen = false }) {
  if (!chart || !chart.chart_type) return null;

  const {
    chart_type,
    kpi_name,
    unit_label,
    scale = 1,
    series = [],
    bucket_unit,
    title_fa,
  } = chart;

  const title = title_fa || kpi_name || '';
  const subtitle = unit_label ? `واحد: ${unit_label}` : '';
  const stats = computeChartStats(chart);
  const BASE_HEIGHT = 420;

  // ═══════════════════════════════════════════════════════════════════════
  // BAR
  // ═══════════════════════════════════════════════════════════════════════
  if (chart_type === 'bar') {
    const { categories, apexSeries, cappedNote, mode } = normalizeBarData(
      series,
      scale,
      kpi_name
    );

    const hasData = apexSeries.some((s) => (s.data || []).some((v) => v != null));
    if (!hasData) {
      return (
        <ChartShell title={title} subtitle={subtitle}>
          <EmptyState />
        </ChartShell>
      );
    }

    const nCat = categories.length;
    const singleSeries = apexSeries.length === 1;
    // Printed numbers are the point of this redesign, but past ~20-24
    // bars/segments they start overlapping each other into noise — past
    // that density fall back to tooltip-on-hover instead of fighting for
    // space (still readable via the value axis + tooltip, just not baked
    // onto every single bar).
    const labelDensity = singleSeries ? nCat : nCat * apexSeries.length;
    const showBarLabels = labelDensity <= 24;
    // Horizontal bars when many categories — more readable for branch names
    const horizontal = singleSeries && nCat >= 8;
    // Each horizontal row needs real vertical room for a Persian branch
    // name to sit next to its bar without crowding into the next row —
    // a fixed 360px for e.g. 14 branches is exactly what produced bars
    // packed tight enough that the (now-fixed) label bug was unreadable
    // even once correct.
    const chartHeight = isFullscreen
      ? '100%'
      : horizontal
        ? Math.min(620, Math.max(BASE_HEIGHT, nCat * 30 + 60))
        : BASE_HEIGHT;

    const options = {
      chart: {
        ...BASE_CHART,
        type: 'bar',
        stacked: false,
      },
      plotOptions: {
        bar: {
          horizontal,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          columnWidth: singleSeries ? (nCat <= 4 ? '45%' : nCat <= 8 ? '55%' : '68%') : '70%',
          barHeight: horizontal ? (nCat > 12 ? '72%' : '58%') : undefined,
          dataLabels: { position: horizontal ? 'top' : 'top' },
          distributed: singleSeries, // one color per category when snapshot
        },
      },
      colors: singleSeries ? PALETTE : PALETTE,
      fill: {
        type: 'solid',
        opacity: 1,
      },
      stroke: {
        show: true,
        width: 0,
        colors: ['transparent'],
      },
      // Numbers-on-the-bar is the #1 legibility fix over the old chart:
      // a reader shouldn't have to hover/tooltip just to read a value —
      // reference dashboards (image 1/2) always print the value on or
      // right next to the bar itself.
      dataLabels: {
        enabled: showBarLabels,
        formatter: (val) => toFaNumber(val),
        offsetX: horizontal ? 6 : 0,
        offsetY: horizontal ? 0 : -18,
        textAnchor: horizontal ? 'start' : 'middle',
        style: {
          fontSize: horizontal ? '11.5px' : '12px',
          fontFamily: FONT,
          fontWeight: 700,
          colors: ['#1E293B'],
        },
        background: { enabled: false },
        dropShadow: { enabled: false },
      },
      grid: {
        ...GRID,
        padding: { top: 24, right: horizontal ? 46 : 16, bottom: 0, left: 8 },
        xaxis: { lines: { show: horizontal } },
        yaxis: { lines: { show: !horizontal } },
      },
      xaxis: {
        categories: categories.map((c) => truncateLabel(c, horizontal ? 22 : 14)),
        labels: {
          style: { fontSize: '13px', fontFamily: FONT, colors: '#1E293B', fontWeight: 700 },
          rotate: !horizontal && nCat > 6 ? -40 : 0,
          rotateAlways: !horizontal && nCat > 10,
          hideOverlappingLabels: true,
          trim: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        title: { text: undefined },
      },
      yaxis: {
        labels: {
          // Bumped from 11px/600-500 weight and widened maxWidth so real
          // branch/city names (Persian, often 15-25 chars) get room to
          // render instead of being ellipsis-truncated into near-identical
          // labels — the other half of why every bar used to look
          // unlabeled/interchangeable.
          style: { fontSize: '13px', fontFamily: FONT, colors: '#1E293B', fontWeight: 800 },
          formatter: (val) => (horizontal ? val : toFaNumber(val)),
          maxWidth: horizontal ? 190 : 60,
        },
      },
      tooltip: {
        ...TOOLTIP,
        y: {
          formatter: (val) =>
            val == null ? 'بدون داده' : `${toFaFull(val)}${unit_label ? ` ${unit_label}` : ''}`,
        },
      },
      legend: singleSeries
        ? { show: false }
        : {
            ...LEGEND,
            position: 'top',
          },
      states: {
        hover: { filter: { type: 'darken', value: 0.88 } },
        active: { filter: { type: 'darken', value: 0.82 } },
      },
      noData: { text: 'داده‌ای موجود نیست', style: { fontFamily: FONT, color: '#94A3B8' } },
    };

    return (
      <ChartShell
        title={title}
        subtitle={subtitle}
        accent={PALETTE[0]}
        stats={stats}
        note={
          cappedNote ||
          (!showBarLabels ? 'برای دیدن مقدار دقیق هر میله، نشانگر را روی آن نگه دارید.' : null)
        }
        footnote={
          horizontal
            ? 'نام شعب روی محور عمودی — برای جزئیات روی میله‌ها نگه دارید.'
            : mode === 'grouped'
              ? 'میله‌های کنارهم: مقایسه دوره‌ها برای هر واحد.'
              : 'برای بزرگ‌نمایی، ناحیه را انتخاب کنید.'
        }
      >
        <div className="w-full" style={{ height: chartHeight }}>
          <Chart options={options} series={apexSeries} type="bar" height="100%" width="100%" />
        </div>
      </ChartShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LINE / AREA (time series)
  // ═══════════════════════════════════════════════════════════════════════
  const labelSet = new Set();
  series.forEach((s) => s.buckets?.forEach((b) => labelSet.add(b.label)));
  const labels = Array.from(labelSet).sort(compareLabels);

  const rankedSeries = [...series].sort((a, b) => {
    const lastOf = (s) => {
      for (let i = (s.buckets?.length || 0) - 1; i >= 0; i--) {
        if (s.buckets[i]?.value != null) return Math.abs(s.buckets[i].value);
      }
      return 0;
    };
    return lastOf(b) - lastOf(a);
  });

  const seriesTrimmed = rankedSeries.length > MAX_SERIES;
  const visibleSeries = seriesTrimmed ? rankedSeries.slice(0, MAX_SERIES) : rankedSeries;

  const finalCategories = labels.map((label) => formatTimeLabel(label, bucket_unit));
  const finalSeries = visibleSeries.map((s) => ({
    name: truncateLabel(s.entity_name, 20),
    data: labels.map((label) => {
      const bucket = s.buckets?.find((b) => b.label === label);
      return bucket?.value != null ? bucket.value / scale : null;
    }),
  }));

  const hasData = finalSeries.some((s) => s.data.some((v) => v != null));
  if (!hasData) {
    return (
      <ChartShell title={title} subtitle={subtitle}>
        <EmptyState message="برای این بازه زمانی داده‌ای ثبت نشده است." />
      </ChartShell>
    );
  }

  const isSinglePoint = labels.length <= 1;
  const singleSeries = finalSeries.length === 1;
  const apexType = singleSeries ? 'area' : 'line';
  // A crowded multi-series legend wraps to 2-3 rows — give it room instead
  // of squeezing the plot area, another contributor to the "can't tell
  // lines apart" complaint (legend chips overlapping/clipping at 360px).
  const chartHeight = isFullscreen
    ? '100%'
    : !singleSeries && finalSeries.length > 5
      ? BASE_HEIGHT + 40
      : BASE_HEIGHT;
  const useDashPattern = !singleSeries && finalSeries.length > 4;
  // Same "print the number, don't hide it behind a hover" fix as the bar
  // chart, scoped to the case it actually helps: one trend line with few
  // enough points that labels won't collide (multi-series is left to the
  // shared tooltip — labelling every series at every point is unreadable
  // no matter the font).
  const showLineLabels = singleSeries && labels.length <= 10;

  const lineOptions = {
    chart: {
      ...BASE_CHART,
      type: apexType,
    },
    colors: singleSeries ? [PALETTE[0]] : PALETTE,
    stroke: {
      width: singleSeries ? 3.5 : labels.length <= 4 ? 3 : 2.5,
      curve: labels.length <= 3 ? 'straight' : 'smooth',
      lineCap: 'round',
      colors: singleSeries ? [PALETTE[0]] : undefined,
      // Solid/dashed/dotted rotation as a second differentiation channel
      // beyond color once there are enough series that two lines can end
      // up close in both hue and value — exactly what image 2 showed.
      dashArray: useDashPattern ? buildDashArray(finalSeries.length) : 0,
    },
    fill: singleSeries
      ? {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.25,
            opacityFrom: 0.4,
            opacityTo: 0.05,
            stops: [0, 85, 100],
            colorStops: [
              { offset: 0, color: PALETTE[0], opacity: 0.42 },
              { offset: 100, color: PALETTE[0], opacity: 0.04 },
            ],
          },
        }
      : { type: 'solid', opacity: 0 },
    markers: {
      // Keep points visible — size 0 on dense charts hid the whole series
      // when only a few buckets existed (Tehran compare looked like 2 dots).
      size: isSinglePoint ? 7 : labels.length > 40 ? 0 : labels.length > 20 ? 3 : labels.length <= 4 ? 6 : 4,
      colors: singleSeries ? [PALETTE[0]] : PALETTE,
      strokeColors: '#fff',
      strokeWidth: 2,
      // Bigger hover bump when many series overlap at the same x — makes
      // it obvious which point the tooltip/crosshair is currently on.
      hover: { size: useDashPattern ? 8 : 7, sizeOffset: 2 },
      discrete: [],
    },
    dataLabels: {
      enabled: showLineLabels,
      formatter: (val) => toFaNumber(val),
      offsetY: -12,
      style: { fontSize: '13px', fontFamily: FONT, fontWeight: 800, colors: ['#0F172A'] },
      background: {
        enabled: true,
        foreColor: '#1E293B',
        borderWidth: 0,
        padding: 3,
        opacity: 0.92,
        dropShadow: { enabled: false },
      },
    },
    grid: { ...GRID, padding: { ...GRID.padding, top: showLineLabels ? 24 : GRID.padding.top } },
    xaxis: {
      categories: finalCategories,
      labels: {
        show: true,
        style: { fontSize: finalCategories.length <= 6 ? '14px' : '13px', fontFamily: FONT, colors: '#1E293B', fontWeight: 700 },
        rotate: finalCategories.length > 8 ? -40 : 0,
        rotateAlways: finalCategories.length > 8,
        hideOverlappingLabels: false,
        showDuplicates: false,
        trim: false,
        maxHeight: 90,
      },
      tickAmount: finalCategories.length <= 12 ? finalCategories.length : undefined,
      axisBorder: { show: true, color: '#94A3B8', height: 1 },
      axisTicks: { show: true, color: '#94A3B8', height: 6 },
      tooltip: { enabled: false },
      crosshairs: {
        show: true,
        stroke: { color: '#94A3B8', width: 1, dashArray: 4 },
      },
    },
    yaxis: {
      labels: {
        show: true,
        style: { fontSize: '13px', fontFamily: FONT, colors: '#1E293B', fontWeight: 700 },
        formatter: (val) => toFaNumber(val),
        minWidth: 48,
      },
    },
    tooltip: {
      ...TOOLTIP,
      shared: true,
      intersect: false,
      x: { show: true },
      y: {
        formatter: (val) =>
          val == null ? 'بدون داده' : `${toFaFull(val)}${unit_label ? ` ${unit_label}` : ''}`,
      },
    },
    legend: singleSeries
      ? { show: false }
      : {
          ...LEGEND,
          ...(finalSeries.length > 5 ? { height: 56 } : {}),
        },
    connectNulls: false,
    noData: { text: 'داده‌ای موجود نیست', style: { fontFamily: FONT, color: '#94A3B8' } },
  };

  const note = [
    seriesTrimmed
      ? `نمایش ${MAX_SERIES} روند برتر از ${rankedSeries.length} مورد`
      : null,
    isSinglePoint
      ? 'این بازه فقط یک نقطه دارد — برای روند، بازه بزرگ‌تری انتخاب کنید.'
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const footnote = singleSeries
    ? 'برای زوم، روی نمودار بکشید — دوبار کلیک برای بازگشت. دانلود از نوار ابزار بالا.'
    : 'برای مقایسه بهتر، روی نام هر شعبه در راهنمای بالا کلیک کنید تا فقط همان روند نمایش داده شود — برای زوم روی نمودار بکشید.';

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      accent={singleSeries ? PALETTE[0] : PALETTE[1]}
      stats={stats}
      note={note || null}
      footnote={footnote}
    >
      <div className="w-full" style={{ height: chartHeight }}>
        <Chart
          options={lineOptions}
          series={finalSeries}
          type={apexType}
          height="100%"
          width="100%"
        />
      </div>
    </ChartShell>
  );
}