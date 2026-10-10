import { useMemo, useState } from 'react';
import { Moon, Calendar, Check, ArrowRight, Sparkles, Sunrise } from 'lucide-react';
import type { Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { todayISO } from '../utils/helpers';
import { smartSort } from '../utils/smartSort';

interface GentleResetViewProps {
  tasks: Task[];
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function GentleResetView({ tasks, onUpdate, onToggle, onEdit, onDelete }: GentleResetViewProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(todayISO());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const unfinished = useMemo(() => {
    return smartSort(
      tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= todayISO())
    );
  }, [tasks]);

  const noDateTasks = useMemo(() => {
    return smartSort(tasks.filter((t) => !t.completed && !t.dueDate));
  }, [tasks]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(unfinished.map((t) => t.id)));
  }

  function rescheduleSelected() {
    for (const id of selectedIds) {
      onUpdate(id, { dueDate: rescheduleDate });
    }
    setSelectedIds(new Set());
    setRescheduleOpen(false);
  }

  function rescheduleOne(id: string, date: string) {
    onUpdate(id, { dueDate: date });
  }

  const hasUnfinished = unfinished.length > 0 || noDateTasks.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Moon size={18} className="text-ink-400 dark:text-ink-300" strokeWidth={2} />
          <h1 className="font-display text-2xl font-semibold text-default">Gentle Reset</h1>
        </div>
        <p className="text-sm text-muted">
          Review what didn't get done and reschedule with intention. Tomorrow is a fresh start.
        </p>
      </div>

      {!hasUnfinished ? (
        <EmptyState
          icon={Sunrise}
          title="Everything is in order"
          description="No overdue or unfinished tasks. You're all caught up — enjoy the moment."
        />
      ) : (
        <>
          {/* Overdue / unfinished tasks */}
          {unfinished.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Unfinished & Overdue
                  </h2>
                  <span className="text-2xs text-clay-500 font-medium px-1.5 py-0.5 rounded-md bg-clay-50 dark:bg-clay-900/20">
                    {unfinished.length}
                  </span>
                </div>
                <button
                  onClick={selectAll}
                  className="text-2xs text-spark-500 font-medium hover:text-spark-600 transition-colors"
                >
                  Select all
                </button>
              </div>

              <div className="space-y-2">
                {unfinished.map((task) => {
                  const isSelected = selectedIds.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`relative rounded-2xl transition-all ${
                        isSelected ? 'ring-2 ring-spark-400' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleSelect(task.id)}
                          className={`mt-3 ml-3 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-spark-500 border-spark-500'
                              : 'border-paper-300 dark:border-ink-600'
                          }`}
                          aria-label="Select task"
                        >
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <TaskCard
                            task={task}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk reschedule button */}
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setRescheduleOpen(true)}
                  className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl bg-spark-500 text-white text-sm font-medium shadow-soft-lg hover:bg-spark-600 transition-colors animate-slide-up z-30"
                >
                  <Calendar size={16} />
                  Reschedule {selectedIds.size} {selectedIds.size === 1 ? 'task' : 'tasks'}
                </button>
              )}
            </div>
          )}

          {/* Tasks without dates */}
          {noDateTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  No Date Set
                </h2>
                <span className="text-2xs text-faint">{noDateTasks.length}</span>
              </div>
              <div className="space-y-2">
                {noDateTasks.map((task) => (
                  <div key={task.id} className="relative">
                    <TaskCard
                      task={task}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                    {/* Quick reschedule buttons */}
                    <div className="flex gap-1.5 mt-1.5 px-1">
                      <button
                        onClick={() => rescheduleOne(task.id, todayISO())}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium bg-subtle text-muted hover:text-spark-500 hover:bg-spark-50 dark:hover:bg-spark-900/20 transition-colors"
                      >
                        <Sparkles size={11} />
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          rescheduleOne(task.id, tomorrow.toISOString().slice(0, 10));
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium bg-subtle text-muted hover:text-spark-500 hover:bg-spark-50 dark:hover:bg-spark-900/20 transition-colors"
                      >
                        <ArrowRight size={11} />
                        Tomorrow
                      </button>
                      <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-2xs font-medium bg-subtle text-muted hover:text-spark-500 hover:bg-spark-50 dark:hover:bg-spark-900/20 transition-colors cursor-pointer">
                        <Calendar size={11} />
                        <input
                          type="date"
                          min={todayISO()}
                          onChange={(e) => e.target.value && rescheduleOne(task.id, e.target.value)}
                          className="sr-only"
                        />
                        Pick date
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reschedule modal */}
      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule Tasks"
        footer={
          <>
            <button
              onClick={() => setRescheduleOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-default bg-subtle hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={rescheduleSelected}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-spark-500 hover:bg-spark-600 transition-colors"
            >
              Reschedule
            </button>
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Move {selectedIds.size} {selectedIds.size === 1 ? 'task' : 'tasks'} to a new date:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setRescheduleDate(todayISO())}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-subtle text-muted hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setRescheduleDate(d.toISOString().slice(0, 10));
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-subtle text-muted hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 7);
              setRescheduleDate(d.toISOString().slice(0, 10));
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-subtle text-muted hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
          >
            Next Week
          </button>
        </div>
        <input
          type="date"
          value={rescheduleDate}
          min={todayISO()}
          onChange={(e) => setRescheduleDate(e.target.value)}
          className="w-full px-3.5 py-3 rounded-xl bg-subtle border border-default text-sm text-default focus:outline-none focus:border-spark-400 focus:ring-4 focus:ring-spark-500/10 transition-all"
        />
      </Modal>
    </div>
  );
}
