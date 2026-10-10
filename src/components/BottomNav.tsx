import { Sun, Calendar, Target, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import type { ViewName } from '../types';

interface BottomNavProps {
  active: ViewName;
  onChange: (view: ViewName) => void;
  taskCount: number;
}

const NAV_ITEMS: { view: ViewName; label: string; icon: typeof Sun }[] = [
  { view: 'today', label: 'Today', icon: Sun },
  { view: 'tasks', label: 'Tasks', icon: Calendar },
  { view: 'focus', label: 'Focus', icon: Target },
  { view: 'reset', label: 'Reset', icon: RefreshCw },
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function BottomNav({ active, onChange, taskCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-elevated/90 backdrop-blur-lg border-t border-default pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-2xl mx-auto h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onChange(item.view)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors group"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`relative flex items-center justify-center w-9 h-7 rounded-lg transition-all ${
                  isActive
                    ? 'bg-spark-50 dark:bg-spark-900/25'
                    : 'group-hover:bg-subtle'
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-colors ${
                    isActive ? 'text-spark-500' : 'text-faint group-hover:text-muted'
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                {item.view === 'reset' && taskCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-spark-500" />
                )}
              </div>
              <span
                className={`text-2xs transition-colors ${
                  isActive ? 'text-spark-500 font-medium' : 'text-faint'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
