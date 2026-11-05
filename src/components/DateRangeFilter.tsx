import { useState } from 'react';
import { addDays, addMonths, currentMonth, monthRange, todayIso, type DateRange } from '../lib/format';

const PRESETS = {
  thisMonth: 'This month',
  lastMonth: 'Last month',
  last3: 'Last 3 months',
  last6: 'Last 6 months',
  last12: 'Last 12 months',
  thisYear: 'This year',
  custom: 'Custom range',
} as const;

export type Preset = keyof typeof PRESETS;

export function presetRange(preset: Exclude<Preset, 'custom'>): DateRange {
  const today = todayIso();
  const monthStart = `${currentMonth()}-01`;
  switch (preset) {
    case 'thisMonth':
      return monthRange(currentMonth());
    case 'lastMonth':
      return monthRange(addMonths(monthStart, -1).slice(0, 7));
    case 'last3':
      return { start: addMonths(monthStart, -2), end: today };
    case 'last6':
      return { start: addMonths(monthStart, -5), end: today };
    case 'last12':
      return { start: addMonths(monthStart, -11), end: today };
    case 'thisYear':
      return { start: `${today.slice(0, 4)}-01-01`, end: today };
  }
}

interface Props {
  initial: Exclude<Preset, 'custom'>;
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangeFilter({ initial, value, onChange }: Props) {
  const [preset, setPreset] = useState<Preset>(initial);

  function choose(next: Preset) {
    setPreset(next);
    if (next !== 'custom') onChange(presetRange(next));
  }

  return (
    <div className="filters">
      <label className="inline-label">
        Period
        <select value={preset} onChange={(e) => choose(e.target.value as Preset)}>
          {(Object.keys(PRESETS) as Preset[]).map((p) => (
            <option key={p} value={p}>{PRESETS[p]}</option>
          ))}
        </select>
      </label>
      {preset === 'custom' && (
        <>
          <label className="inline-label">
            From
            <input
              type="date"
              value={value.start}
              max={value.end}
              onChange={(e) => e.target.value && onChange({ ...value, start: e.target.value })}
            />
          </label>
          <label className="inline-label">
            To
            <input
              type="date"
              value={value.end}
              min={value.start}
              max={addDays(todayIso(), 366)}
              onChange={(e) => e.target.value && onChange({ ...value, end: e.target.value })}
            />
          </label>
        </>
      )}
    </div>
  );
}
