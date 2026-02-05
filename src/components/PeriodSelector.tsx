'use client';

const LIFE_PERIODS = [
  { id: 'early_childhood', label: 'Early Childhood (0-5)', shortLabel: 'Early Child.' },
  { id: 'childhood', label: 'Childhood (6-12)', shortLabel: 'Childhood' },
  { id: 'teenage', label: 'Teenage Years (13-19)', shortLabel: 'Teenage' },
  { id: 'young_adult', label: 'Young Adulthood (20-35)', shortLabel: 'Young Adult' },
  { id: 'middle_adult', label: 'Middle Adulthood (36-55)', shortLabel: 'Middle Adult' },
  { id: 'later_adult', label: 'Later Adulthood (56+)', shortLabel: 'Later Adult' },
];

interface PeriodSelectorProps {
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
  disabled?: boolean;
}

export default function PeriodSelector({
  currentPeriod,
  onPeriodChange,
  disabled,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="period" className="text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap">
        <span className="hidden sm:inline">Life Period:</span>
        <span className="sm:hidden">Period:</span>
      </label>
      <select
        id="period"
        value={currentPeriod}
        onChange={(e) => onPeriodChange(e.target.value)}
        disabled={disabled}
        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-900 max-w-[150px] sm:max-w-none"
      >
        {LIFE_PERIODS.map((period) => (
          <option key={period.id} value={period.id}>
            {period.label}
          </option>
        ))}
      </select>
    </div>
  );
}
