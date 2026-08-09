import { useMemo, useState } from 'react';

export default function EntityPicker({
  hierarchy,
  startLevel = 'province',
  presetProvince = null,
  presetCity = null,
  onPick,
  busy,
}) {
  const [level, setLevel] = useState(startLevel);
  const [province, setProvince] = useState(presetProvince);
  const [city, setCity] = useState(presetCity);

  const provinces = useMemo(
    () => [...new Set(hierarchy.map((r) => r.province_name).filter(Boolean))].sort(),
    [hierarchy]
  );
  const cities = useMemo(
    () =>
      [...new Set(
        hierarchy
          .filter((r) => !province || r.province_name === province)
          .map((r) => r.city_name)
          .filter(Boolean)
      )].sort(),
    [hierarchy, province]
  );
  const branches = useMemo(
    () =>
      hierarchy.filter(
        (r) => (!province || r.province_name === province) && (!city || r.city_name === city)
      ),
    [hierarchy, province, city]
  );

  const goBack = () => {
    if (level === 'branch') setLevel(startLevel === 'branch' ? 'branch' : city && startLevel !== 'city' ? 'city' : 'province');
    else if (level === 'city') setLevel('province');
  };

  if (level === 'province') {
    return (
      <div className="w-full flex flex-col gap-1.5" dir="rtl">
        {provinces.map((p) => (
          <button
            key={p}
            disabled={busy}
            onClick={() => { setProvince(p); setLevel('city'); }}
            className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100"
          >
            {p}
          </button>
        ))}
      </div>
    );
  }

  if (level === 'city') {
    return (
      <div className="w-full flex flex-col gap-1.5" dir="rtl">
        {startLevel === 'province' && (
          <button disabled={busy} onClick={() => setLevel('province')} className="text-[10px] text-indigo-500 self-start">
            ← بازگشت به استان‌ها
          </button>
        )}
        {province && (
          <button
            disabled={busy}
            onClick={() => onPick({ entity_level: 'province', entity_value: province })}
            className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-100/70 border border-indigo-200 hover:bg-indigo-200"
          >
            روند کل استان «{province}»
          </button>
        )}
        {cities.map((c) => (
          <button
            key={c}
            disabled={busy}
            onClick={() => { setCity(c); setLevel('branch'); }}
            className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100"
          >
            {c}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-1.5" dir="rtl">
      {startLevel !== 'branch' && (
        <button disabled={busy} onClick={goBack} className="text-[10px] text-indigo-500 self-start">
          ← بازگشت به شهرها
        </button>
      )}
      {city && (
        <button
          disabled={busy}
          onClick={() => onPick({ entity_level: 'city', entity_value: city })}
          className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-100/70 border border-indigo-200 hover:bg-indigo-200"
        >
          روند کل شهر «{city}»
        </button>
      )}
      {branches.map((b) => (
        <button
          key={b.branch_number}
          disabled={busy}
          onClick={() => onPick({ entity_level: 'branch', entity_value: String(b.branch_number) })}
          className="w-full text-right py-2 px-3 rounded-xl text-[11.5px] text-indigo-800 bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-100"
        >
          روند شعبه «{b.branch_name}»
        </button>
      ))}
    </div>
  );
}