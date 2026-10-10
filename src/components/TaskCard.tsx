import { useState, useRef, useEffect } from 'react';
import { Check, Pencil, Trash2, Clock, Calendar, GripVertical } from 'lucide-react';
import type { Task } from '../types';
import { PRIORITY_META, CATEGORY_META } from '../constants';
import { formatDueDate, formatDuration, isOverdue, daysUntilDue } from '../utils/helpers';
import { CategoryIcon } from './CategoryIcon';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onSetActive?: (id: string) => void;
  isActive?: boolean;
  compact?: boolean;
}

export function TaskCard({ task, onToggle, onEdit, onDelete, onSetActive, isActive, compact }: TaskCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const isOverdueTask = !task.completed && isOverdue(task.dueDate);
  const prio = PRIORITY_META[task.priority];

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dy) > Math.abs(dx)) {
      dragging.current = false;
      setSwipeX(0);
      return;
    }
    if (dx < 0) {
      setSwipeX(Math.max(dx, -80));
    }
  }

  function onTouchEnd() {
    if (swipeX < -40) {
      setShowActions(true);
      setSwipeX(-80);
    } else {
      setShowActions(false);
      setSwipeX(0);
    }
    dragging.current = false;
  }

  // Auto-hide actions after a while
  useEffect(() => {
    if (showActions) {
      const timer = setTimeout(() => {
        setShowActions(false);
        setSwipeX(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showActions]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Action background */}
      <div className="absolute inset-0 flex items-center justify-end gap-2 pr-3">
        <button
          onClick={() => onEdit(task)}
          className="w-10 h-10 rounded-xl bg-paper-200 dark:bg-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-100"
          aria-label="Edit task"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="w-10 h-10 rounded-xl bg-clay-500 flex items-center justify-center text-white"
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div
        className={`relative bg-elevated border rounded-2xl transition-transform duration-200 ${
          isActive
            ? 'border-spark-400 shadow-glow'
            : isOverdueTask
            ? 'border-clay-200 dark:border-clay-900/50'
            : 'border-default'
        } ${task.completed ? 'opacity-60' : ''}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`flex items-start gap-3 ${compact ? 'p-3' : 'p-4'}`}>
          {/* Complete checkbox */}
          <button
            onClick={() => onToggle(task.id)}
            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-sage-500 border-sage-500 animate-check-pop'
                : 'border-paper-300 dark:border-ink-600 hover:border-spark-400'
            }`}
            aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
          >
            {task.completed && <Check size={14} className="text-white" strokeWidth={3} />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p
                className={`text-sm font-medium leading-snug ${
                  task.completed ? 'line-through text-faint' : 'text-default'
                }`}
              >
                {task.title}
              </p>
            </div>

            {task.notes && !compact && (
              <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{task.notes}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Priority badge */}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-2xs font-medium ${prio.bg} ${prio.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                {prio.label}
              </span>

              {/* Category */}
              <span className="inline-flex items-center gap-1 text-2xs text-muted">
                <CategoryIcon category={task.category} size={12} />
                {CATEGORY_META[task.category].label}
              </span>

              {/* Due date */}
              {task.dueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-2xs ${
                    isOverdueTask ? 'text-clay-500 font-medium' : 'text-muted'
                  }`}
                >
                  <Calendar size={12} />
                  {formatDueDate(task.dueDate)}
                  {isOverdueTask && ` (${Math.abs(daysUntilDue(task.dueDate))}d)`}
                </span>
              )}

              {/* Duration */}
              {task.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 text-2xs text-muted">
                  <Clock size={12} />
                  {formatDuration(task.estimatedMinutes)}
                </span>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {onSetActive && !task.completed && (
              <button
                onClick={() => onSetActive(task.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'text-spark-500 bg-spark-50 dark:bg-spark-900/20'
                    : 'text-faint hover:text-default hover:bg-subtle'
                }`}
                aria-label="Set as focus task"
                title="Focus on this"
              >
                <GripVertical size={16} />
              </button>
            )}
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-faint hover:text-default hover:bg-subtle transition-colors"
              aria-label="Edit task"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 rounded-lg text-faint hover:text-clay-500 hover:bg-clay-50 dark:hover:bg-clay-900/20 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
