import { useMemo } from 'react';
import { Sunrise, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import type { Task } from '../types';
import type { CreateTaskInput } from '../hooks/useTasks';
import { QuickDump } from '../components/QuickDump';
import { PriorityHighlight } from '../components/PriorityHighlight';
import { TaskCard } from '../components/TaskCard';
import { EmptyState } from '../components/EmptyState';
import { ProgressRing } from '../components/ProgressRing';
import { getTopPriorities, getTodayProgress, getRemainingWorkload, smartSort } from '../utils/smartSort';
import { formatDuration, todayISO, isDueToday } from '../utils/helpers';

interface TodayViewProps {
  tasks: Task[];
  onCreate: (inputs: CreateTaskInput[]) => void;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onFocusTask: (id: string) => void;
}

export function TodayView({ tasks, onCreate, onToggle, onEdit, onDelete, onFocusTask }: TodayViewProps) {
  const topPriorities = useMemo(() => getTopPriorities(tasks, 3), [tasks]);
  const progress = useMemo(() => getTodayProgress(tasks), [tasks]);
  const remainingMinutes = useMemo(() => getRemainingWorkload(tasks), [tasks]);

  const todaysTasks = useMemo(() => {
    const today = todayISO();
    return smartSort(tasks.filter((t) => t.dueDate === today));
  }, [tasks]);

  const completedToday = todaysTasks.filter((t) => t.completed);
  const incompleteToday = todaysTasks.filter((t) => !t.completed);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-spark-500 uppercase tracking-wider">{todayLabel}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-default">
          {greeting}
        </h1>
      </div>

      {/* Quick Dump */}
      <QuickDump onCreate={onCreate} defaultDueDate={todayISO()} />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {/* Progress ring */}
        <div className="bg-elevated border border-default rounded-2xl p-4 flex flex-col items-center justify-center">
          <ProgressRing percent={progress.percent} size={56} strokeWidth={5}>
            <span className="text-xs font-bold text-default">{progress.percent}%</span>
          </ProgressRing>
          <p className="text-2xs text-muted mt-2 text-center">
            {progress.completed}/{progress.total} done
          </p>
        </div>

        {/* Remaining workload */}
        <div className="bg-elevated border border-default rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Clock size={22} className="text-amber-500" strokeWidth={2} />
          </div>
          <p className="text-2xs text-muted mt-2 text-center">
            {remainingMinutes > 0 ? formatDuration(remainingMinutes) : 'All clear'} left
          </p>
        </div>

        {/* Tasks today count */}
        <div className="bg-elevated border border-default rounded-2xl p-4 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-spark-50 dark:bg-spark-900/20 flex items-center justify-center">
            <ListTodo size={22} className="text-spark-500" strokeWidth={2} />
          </div>
          <p className="text-2xs text-muted mt-2 text-center">
            {todaysTasks.length} {todaysTasks.length === 1 ? 'task' : 'tasks'} today
          </p>
        </div>
      </div>

      {/* Top priorities */}
      {topPriorities.length > 0 && (
        <PriorityHighlight tasks={topPriorities} onToggle={onToggle} onFocus={onFocusTask} />
      )}

      {/* Today's task list */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Today's List</h2>
          {completedToday.length > 0 && (
            <span className="text-2xs text-faint">{completedToday.length} completed</span>
          )}
        </div>

        {todaysTasks.length === 0 ? (
          <EmptyState
            icon={Sunrise}
            title="A clean slate for today"
            description="Add tasks above to start planning your day. Quick dump lets you add many at once, one per line."
          />
        ) : (
          <div className="space-y-2">
            {incompleteToday.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onSetActive={onFocusTask}
                isActive={false}
              />
            ))}
            {completedToday.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4 pb-1 px-1">
                  <CheckCircle2 size={14} className="text-sage-500" />
                  <span className="text-2xs font-medium uppercase tracking-wider text-faint">Completed</span>
                </div>
                {completedToday.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    compact
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
