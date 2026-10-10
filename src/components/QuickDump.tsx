import { useState, useRef, useEffect } from 'react';
import { Plus, Sparkles, Calendar } from 'lucide-react';
import type { CreateTaskInput } from '../hooks/useTasks';
import type { Priority } from '../types';
import { PRIORITY_META, PRIORITY_ORDER } from '../constants';
import { todayISO } from '../utils/helpers';

interface QuickDumpProps {
  onCreate: (inputs: CreateTaskInput[]) => void;
  defaultPriority?: Priority;
  defaultDueDate?: string | null;
}

export function QuickDump({ onCreate, defaultPriority = 'medium', defaultDueDate = null }: QuickDumpProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [dueDate, setDueDate] = useState<string>(defaultDueDate ?? '');
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPriority(defaultPriority);
  }, [defaultPriority]);

  useEffect(() => {
    setDueDate(defaultDueDate ?? '');
  }, [defaultDueDate]);

  function handleAdd() {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const inputs: CreateTaskInput[] = lines.map((title) => ({
      title,
      priority,
      dueDate: dueDate || null,
    }));
    onCreate(inputs);
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl+Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  return (
    <div className="bg-elevated border border-default rounded-2xl shadow-soft overflow-hidden transition-all">
      <div className="flex items-start gap-2.5 p-3.5">
        <div className="mt-0.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-spark-50 dark:bg-spark-900/20 flex items-center justify-center">
            <Plus size={16} className="text-spark-500" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setExpanded(true)}
            placeholder="Quick dump — one task per line..."
            rows={1}
            className="w-full text-sm text-default placeholder:text-faint bg-transparent resize-none focus:outline-none leading-relaxed"
            aria-label="Quick dump task input"
          />
        </div>
      </div>

      {expanded && (
        <div className="flex items-center justify-between gap-2 px-3.5 pb-3.5 pt-1 animate-slide-up">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority selector */}
            <div className="flex items-center gap-1">
              {PRIORITY_ORDER.map((p) => {
                const meta = PRIORITY_META[p];
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isActive ? `ring-2 ring-offset-2 ring-offset-elevated ring-${meta.color}-400` : ''
                    }`}
                    aria-label={`${meta.label} priority`}
                    title={meta.label}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${meta.dot} ${isActive ? '' : 'opacity-30'}`} />
                  </button>
                );
              })}
            </div>

            {/* Due date quick set */}
            <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-subtle cursor-pointer hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors">
              <Calendar size={13} className="text-muted" />
              <input
                type="date"
                value={dueDate}
                min={todayISO()}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-2xs text-muted bg-transparent focus:outline-none w-[100px]"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xs text-faint hidden sm:inline">
              {text.split('\n').filter((l) => l.trim()).length} task{ text.split('\n').filter((l) => l.trim()).length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-spark-500 text-white text-xs font-medium hover:bg-spark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles size={13} strokeWidth={2.5} />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
