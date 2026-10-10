import { Flame, ArrowRight } from 'lucide-react';
import type { Task } from '../types';
import { PRIORITY_META, CATEGORY_META } from '../constants';
import { formatDueDate, isOverdue, daysUntilDue } from '../utils/helpers';
import { CategoryIcon } from './CategoryIcon';

interface PriorityHighlightProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onFocus?: (id: string) => void;
}

export function PriorityHighlight({ tasks, onToggle, onFocus }: PriorityHighlightProps) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Flame size={16} className="text-spark-500" strokeWidth={2} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Top {tasks.length} {tasks.length === 1 ? 'Priority' : 'Priorities'}
        </h2>
      </div>
      <div className="grid gap-2.5">
        {tasks.map((task, i) => {
          const meta = PRIORITY_META[task.priority];
          const overdue = isOverdue(task.dueDate);
          return (
            <div
              key={task.id}
              className={`relative bg-elevated border rounded-2xl p-4 transition-all hover:shadow-soft-md animate-slide-up ${
                overdue ? 'border-clay-200 dark:border-clay-900/50' : 'border-default'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Rank number */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-ink-900 dark:bg-white flex items-center justify-center">
                  <span className="text-xs font-bold text-white dark:text-ink-900">{i + 1}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-default leading-snug">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-2xs font-medium ${meta.bg} ${meta.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-2xs text-muted">
                      <CategoryIcon category={task.category} size={11} />
                      {CATEGORY_META[task.category].label}
                    </span>
                    {task.dueDate && (
                      <span className={`inline-flex items-center gap-1 text-2xs ${overdue ? 'text-clay-500 font-medium' : 'text-muted'}`}>
                        {formatDueDate(task.dueDate)}
                        {overdue && ` (${Math.abs(daysUntilDue(task.dueDate))}d)`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {onFocus && (
                    <button
                      onClick={() => onFocus(task.id)}
                      className="p-2 rounded-lg text-faint hover:text-spark-500 hover:bg-spark-50 dark:hover:bg-spark-900/20 transition-colors"
                      aria-label="Focus on this task"
                      title="Start focus session"
                    >
                      <ArrowRight size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onToggle(task.id)}
                    className="w-6 h-6 rounded-full border-2 border-paper-300 dark:border-ink-600 hover:border-spark-400 transition-colors flex items-center justify-center"
                    aria-label="Mark as done"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
