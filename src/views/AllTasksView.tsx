import { useMemo, useState } from 'react';
import { ListTodo, Inbox } from 'lucide-react';
import type { Task, FilterType } from '../types';
import type { CreateTaskInput } from '../hooks/useTasks';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { TaskCard } from '../components/TaskCard';
import { TaskEditor } from '../components/TaskEditor';
import { EmptyState } from '../components/EmptyState';
import { QuickDump } from '../components/QuickDump';
import { smartSort } from '../utils/smartSort';
import { todayISO, daysUntilDue } from '../utils/helpers';

interface AllTasksViewProps {
  tasks: Task[];
  onCreate: (inputs: CreateTaskInput[]) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onFocusTask: (id: string) => void;
}

export function AllTasksView({ tasks, onCreate, onUpdate, onToggle, onDelete, onFocusTask }: AllTasksViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [editing, setEditing] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showQuickDump, setShowQuickDump] = useState(false);

  const counts = useMemo(() => {
    const today = todayISO();
    return {
      all: tasks.filter((t) => !t.completed).length,
      today: tasks.filter((t) => !t.completed && t.dueDate === today).length,
      upcoming: tasks.filter((t) => !t.completed && t.dueDate && daysUntilDue(t.dueDate) > 0).length,
      overdue: tasks.filter((t) => !t.completed && t.dueDate && daysUntilDue(t.dueDate) < 0).length,
      'no-date': tasks.filter((t) => !t.completed && !t.dueDate).length,
      completed: tasks.filter((t) => t.completed).length,
    } as Partial<Record<FilterType, number>>;
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;

    // Filter
    const today = todayISO();
    switch (filter) {
      case 'today':
        result = result.filter((t) => t.dueDate === today);
        break;
      case 'upcoming':
        result = result.filter((t) => t.dueDate && daysUntilDue(t.dueDate) > 0);
        break;
      case 'overdue':
        result = result.filter((t) => t.dueDate && daysUntilDue(t.dueDate) < 0);
        break;
      case 'no-date':
        result = result.filter((t) => !t.dueDate);
        break;
      case 'completed':
        result = result.filter((t) => t.completed);
        break;
      case 'all':
      default:
        break;
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q)
      );
    }

    return smartSort(result);
  }, [tasks, filter, search]);

  function handleEdit(task: Task) {
    setEditing(task);
    setEditorOpen(true);
  }

  function handleNewTask() {
    setEditing(null);
    setEditorOpen(true);
  }

  function handleSave(id: string | null, updates: Partial<Task>) {
    if (id) {
      onUpdate(id, updates);
    } else {
      // Creating from editor — title is in updates
      onCreate([{ title: updates.title ?? '', ...updates }]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-default">All Tasks</h1>
        <button
          onClick={handleNewTask}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-spark-500 text-white text-sm font-medium hover:bg-spark-600 transition-colors shadow-soft"
        >
          <ListTodo size={16} />
          New
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <FilterChips active={filter} onChange={setFilter} counts={counts} />

      {/* Quick dump toggle */}
      {showQuickDump ? (
        <QuickDump
          onCreate={(inputs) => {
            onCreate(inputs);
            setShowQuickDump(false);
          }}
        />
      ) : (
        <button
          onClick={() => setShowQuickDump(true)}
          className="w-full text-left text-sm text-muted py-2.5 px-4 rounded-xl border border-dashed border-default hover:border-spark-300 hover:bg-spark-50/50 dark:hover:bg-spark-900/10 transition-colors"
        >
          + Quick dump multiple tasks
        </button>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={search ? 'No matching tasks' : 'No tasks here'}
          description={
            search
              ? 'Try adjusting your search or filters.'
              : 'Add a task to get started. Your tasks are saved on this device.'
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={handleEdit}
              onDelete={onDelete}
              onSetActive={onFocusTask}
              isActive={false}
            />
          ))}
        </div>
      )}

      <TaskEditor
        open={editorOpen}
        task={editing}
        onSave={handleSave}
        onClose={() => setEditorOpen(false)}
        onDelete={onDelete}
      />
    </div>
  );
}
