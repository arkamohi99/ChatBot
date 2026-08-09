export default function Breadcrumb({ trail, onNavigate }) {
  // trail: [{ level: 'province'|'city'|'branch', label: string, entity_value: string }]
  if (!trail || trail.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 mb-2 flex-wrap" dir="rtl">
      <button type="button" onClick={() => onNavigate(null)} className="hover:underline font-medium">
        کل کشور
      </button>
      {trail.map((t, i) => (
        <span key={`${t.level}-${t.entity_value}-${i}`} className="flex items-center gap-1.5">
          <span className="text-indigo-300">/</span>
          <button
            type="button"
            onClick={() => onNavigate(t)}
            disabled={i === trail.length - 1}
            className={i === trail.length - 1 ? 'font-semibold text-indigo-900' : 'hover:underline'}
          >
            {t.label}
          </button>
        </span>
      ))}
    </div>
  );
}