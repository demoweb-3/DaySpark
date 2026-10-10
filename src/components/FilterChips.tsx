import type { FilterType } from '../types';

interface FilterChipsProps {
  active: FilterType;
  onChange: (filter: FilterType) => void;
  counts: Partial<Record<FilterType, number>>;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'no-date', label: 'No Date' },
  { key: 'completed', label: 'Done' },
];

export function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        const count = counts[f.key];
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'bg-subtle text-muted hover:text-default hover:bg-paper-200 dark:hover:bg-ink-700'
            }`}
          >
            {f.label}
            {count !== undefined && count > 0 && (
              <span
                className={`text-2xs ${
                  isActive ? 'opacity-70' : 'text-faint'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
