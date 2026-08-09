export default function KpiTabBar({ kpis, activeIndex, onSelect }) {
  // kpis: [{ kpi_name: string }]
  if (!kpis || kpis.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-2 -mx-1 px-1" dir="rtl">
      {kpis.map((k, i) => (
        <button
          key={`${k.kpi_name}-${i}`}
          type="button"
          onClick={() => onSelect(i)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11.5px] font-medium whitespace-nowrap transition
            ${i === activeIndex ? 'bg-purple-800 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
        >
          {k.kpi_name || 'شاخص'}
        </button>
      ))}
    </div>
  );
}