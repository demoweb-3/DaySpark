import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search tasks...' }: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Search
        size={18}
        className="absolute left-3.5 text-faint pointer-events-none"
        strokeWidth={2}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-xl bg-elevated border border-default text-sm text-default placeholder:text-faint focus:outline-none focus:border-spark-400 focus:ring-4 focus:ring-spark-500/10 transition-all"
        aria-label="Search tasks"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 p-1 text-faint hover:text-default transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
