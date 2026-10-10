import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Trash2 } from 'lucide-react';
import type { Task, Priority, Category } from '../types';
import { PRIORITY_META, CATEGORY_META, PRIORITY_ORDER, CATEGORY_ORDER } from '../constants';
import { todayISO } from '../utils/helpers';
import { CategoryIcon } from './CategoryIcon';

interface TaskEditorProps {
  open: boolean;
  task: Task | null;
  onSave: (id: string | null, updates: Partial<Task>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function TaskEditor({ open, task, onSave, onClose, onDelete }: TaskEditorProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('other');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('');

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setNotes(task?.notes ?? '');
      setPriority(task?.priority ?? 'medium');
      setCategory(task?.category ?? 'other');
      setDueDate(task?.dueDate ?? '');
      setEstimatedMinutes(task?.estimatedMinutes?.toString() ?? '');
    }
  }, [open, task]);

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const updates: Partial<Task> = {
      title: trimmedTitle,
      notes: notes.trim(),
      priority,
      category,
      dueDate: dueDate || null,
      estimatedMinutes: estimatedMinutes ? Math.max(1, parseInt(estimatedMinutes, 10)) : null,
    };
    onSave(task?.id ?? null, updates);
    onClose();
  }

  function handleDelete() {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      footer={
        <>
          {task && onDelete && (
            <button
              onClick={handleDelete}
              className="mr-auto px-3 py-2.5 rounded-xl text-sm font-medium text-clay-500 hover:bg-clay-50 dark:hover:bg-clay-900/20 transition-colors"
            >
              <Trash2 size={16} className="inline" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-default bg-subtle hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-spark-500 hover:bg-spark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {task ? 'Save' : 'Add Task'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Task</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSave(); }}
            placeholder="What needs doing?"
            autoFocus
            className="w-full px-3.5 py-3 rounded-xl bg-subtle border border-default text-sm text-default placeholder:text-faint focus:outline-none focus:border-spark-400 focus:ring-4 focus:ring-spark-500/10 transition-all"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details..."
            rows={2}
            className="w-full px-3.5 py-3 rounded-xl bg-subtle border border-default text-sm text-default placeholder:text-faint focus:outline-none focus:border-spark-400 focus:ring-4 focus:ring-spark-500/10 transition-all resize-none"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITY_ORDER.map((p) => {
              const meta = PRIORITY_META[p];
              const isActive = priority === p;
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                    isActive
                      ? `${meta.bg} ${meta.border} ring-2 ring-offset-0`
                      : 'border-default bg-subtle hover:bg-paper-100 dark:hover:bg-ink-700'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                  <span className={`text-2xs font-medium ${isActive ? meta.text : 'text-muted'}`}>
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((c) => {
              const isActive = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isActive
                      ? 'border-spark-400 bg-spark-50 dark:bg-spark-900/20 text-spark-600 dark:text-spark-400'
                      : 'border-default bg-subtle text-muted hover:bg-paper-100 dark:hover:bg-ink-700'
                  }`}
                >
                  <CategoryIcon category={c} size={14} />
                  {CATEGORY_META[c].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Due date & estimate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Due date</label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                min={todayISO()}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-subtle border border-default text-sm text-default focus:outline-none focus:border-spark-400 focus:ring-4 focus:ring-spark-500/10 transition-all"
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-spark-500 font-medium px-2 py-1 hover:bg-spark-50 dark:hover:bg-spark-900/20 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Est. minutes</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="—"
              min={1}
              max={1440}
              className="w-full px-3.5 py-3 rounded-xl bg-subtle border border-default text-sm text-default placeholder:text-faint focus:outline-none focus:border-spark-400 focus:ring-4 focus:ring-spark-500/10 transition-all"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
