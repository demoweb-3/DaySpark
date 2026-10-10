import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-subtle flex items-center justify-center mb-5">
        <Icon size={28} className="text-faint" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-lg font-semibold text-default mb-1.5">{title}</h3>
      <p className="text-muted text-sm leading-relaxed max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-5 py-2.5 rounded-xl bg-spark-500 text-white text-sm font-medium hover:bg-spark-600 transition-colors shadow-soft"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
