import { useMemo, useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Target, Coffee, Brain, Timer as TimerIcon } from 'lucide-react';
import type { Task } from '../types';
import type { TimerConfig, TimerPhase, TimerStatus } from '../hooks/useTimer';
import { ProgressRing } from '../components/ProgressRing';
import { EmptyState } from '../components/EmptyState';
import { formatClock, formatDuration } from '../utils/helpers';
import { smartSort } from '../utils/smartSort';
import { CategoryIcon } from '../components/CategoryIcon';
import { CATEGORY_META } from '../constants';

interface FocusViewProps {
  tasks: Task[];
  timerConfig: TimerConfig;
  timerState: {
    phase: TimerPhase;
    status: TimerStatus;
    remainingSeconds: number;
    totalSeconds: number;
    completedFocusSessions: number;
    activeTaskId: string | null;
  };
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerResume: () => void;
  onTimerReset: () => void;
  onTimerSkip: () => void;
  onTimerSwitchPhase: (phase: TimerPhase) => void;
  onSetActiveTask: (id: string | null) => void;
  onToggleTask: (id: string) => void;
}

export function FocusView({
  tasks,
  timerConfig,
  timerState,
  onTimerStart,
  onTimerPause,
  onTimerResume,
  onTimerReset,
  onTimerSkip,
  onTimerSwitchPhase,
  onSetActiveTask,
  onToggleTask,
}: FocusViewProps) {
  const { phase, status, remainingSeconds, totalSeconds, completedFocusSessions, activeTaskId } = timerState;
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  );

  const focusTasks = useMemo(() => smartSort(tasks.filter((t) => !t.completed)).slice(0, 5), [tasks]);

  const percent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  const phaseMeta = useMemo(() => {
    switch (phase) {
      case 'focus':
        return { label: 'Focus', icon: Target, color: 'text-spark-500', bg: 'bg-spark-50 dark:bg-spark-900/20', ring: 'stroke-spark-500' };
      case 'short-break':
        return { label: 'Short Break', icon: Coffee, color: 'text-sage-500', bg: 'bg-sage-50 dark:bg-sage-900/20', ring: 'stroke-sage-500' };
      case 'long-break':
        return { label: 'Long Break', icon: Brain, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', ring: 'stroke-amber-500' };
    }
  }, [phase]);

  const PhaseIcon = phaseMeta.icon;

  // Session dots
  const sessionsInRound = timerConfig.sessionsBeforeLongBreak;
  const currentInRound = completedFocusSessions % sessionsInRound;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-default">Focus</h1>
        <p className="text-sm text-muted mt-0.5">Work in focused intervals. One thing at a time.</p>
      </div>

      {/* Timer card */}
      <div className="bg-elevated border border-default rounded-3xl p-6 sm:p-8 shadow-soft">
        {/* Phase tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {(['focus', 'short-break', 'long-break'] as TimerPhase[]).map((p) => {
            const isActive = phase === p;
            const label = p === 'focus' ? 'Focus' : p === 'short-break' ? 'Short Break' : 'Long Break';
            return (
              <button
                key={p}
                onClick={() => onTimerSwitchPhase(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? phaseMeta.bg + ' ' + phaseMeta.color
                    : 'text-faint hover:text-muted hover:bg-subtle'
                }`}
                disabled={status === 'running'}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Ring + time */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <ProgressRing percent={percent} size={220} strokeWidth={10}>
              <div className="text-center">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-medium mb-2 ${phaseMeta.bg} ${phaseMeta.color}`}>
                  <PhaseIcon size={12} />
                  {phaseMeta.label}
                </div>
                <div className="font-display text-4xl sm:text-5xl font-semibold text-default tabular-nums tracking-tight">
                  {formatClock(remainingSeconds)}
                </div>
                <p className="text-2xs text-faint mt-1.5">
                  {status === 'running' ? 'in progress' : status === 'paused' ? 'paused' : status === 'finished' ? 'ready for next' : 'ready'}
                </p>
              </div>
            </ProgressRing>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onTimerReset}
              className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-muted hover:text-default hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
              aria-label="Reset timer"
            >
              <RotateCcw size={20} />
            </button>

            {status === 'running' ? (
              <button
                onClick={onTimerPause}
                className="w-16 h-16 rounded-full bg-spark-500 text-white flex items-center justify-center hover:bg-spark-600 shadow-soft-md transition-colors"
                aria-label="Pause timer"
              >
                <Pause size={26} fill="currentColor" />
              </button>
            ) : status === 'paused' ? (
              <button
                onClick={onTimerResume}
                className="w-16 h-16 rounded-full bg-spark-500 text-white flex items-center justify-center hover:bg-spark-600 shadow-soft-md transition-colors"
                aria-label="Resume timer"
              >
                <Play size={26} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={onTimerStart}
                className="w-16 h-16 rounded-full bg-spark-500 text-white flex items-center justify-center hover:bg-spark-600 shadow-soft-md transition-colors"
                aria-label="Start timer"
              >
                <Play size={26} fill="currentColor" />
              </button>
            )}

            <button
              onClick={onTimerSkip}
              className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-muted hover:text-default hover:bg-paper-200 dark:hover:bg-ink-700 transition-colors"
              aria-label="Skip to next phase"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Session dots */}
          <div className="flex items-center gap-1.5 mt-6">
            {Array.from({ length: sessionsInRound }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < currentInRound
                    ? 'bg-spark-500'
                    : i === currentInRound && phase === 'focus'
                    ? 'bg-spark-300 animate-pulse'
                    : 'bg-paper-200 dark:bg-ink-700'
                }`}
              />
            ))}
            <span className="text-2xs text-faint ml-2">
              {completedFocusSessions} {completedFocusSessions === 1 ? 'session' : 'sessions'} completed
            </span>
          </div>
        </div>
      </div>

      {/* Active task */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 px-1">Current Task</h2>
        {activeTask ? (
          <div className="bg-elevated border border-spark-400 rounded-2xl p-4 shadow-glow">
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleTask(activeTask.id)}
                className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 border-spark-400 hover:bg-spark-50 dark:hover:bg-spark-900/20 transition-colors flex items-center justify-center"
                aria-label="Mark as done"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-default">{activeTask.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-2xs text-muted">
                    <CategoryIcon category={activeTask.category} size={11} />
                    {CATEGORY_META[activeTask.category].label}
                  </span>
                  {activeTask.estimatedMinutes && (
                    <span className="text-2xs text-muted">
                      {formatDuration(activeTask.estimatedMinutes)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowTaskPicker(!showTaskPicker)}
                className="text-2xs text-spark-500 font-medium px-2.5 py-1.5 rounded-lg hover:bg-spark-50 dark:hover:bg-spark-900/20 transition-colors"
              >
                Switch
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="w-full text-left p-4 rounded-2xl border border-dashed border-default hover:border-spark-300 hover:bg-spark-50/50 dark:hover:bg-spark-900/10 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted">
              <Target size={16} />
              <span className="text-sm">Choose a task to focus on...</span>
            </div>
          </button>
        )}

        {/* Task picker */}
        {showTaskPicker && (
          <div className="mt-2 space-y-2 animate-slide-down">
            {activeTask && (
              <button
                onClick={() => {
                  onSetActiveTask(null);
                  setShowTaskPicker(false);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-subtle text-sm text-muted hover:text-default transition-colors"
              >
                Clear active task
              </button>
            )}
            {focusTasks.length === 0 ? (
              <p className="text-sm text-faint text-center py-4">No incomplete tasks. Add one first!</p>
            ) : (
              focusTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    onSetActiveTask(task.id);
                    setShowTaskPicker(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    task.id === activeTaskId
                      ? 'border-spark-400 bg-spark-50 dark:bg-spark-900/20'
                      : 'border-default bg-elevated hover:bg-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={task.category} size={14} className="text-muted flex-shrink-0" />
                    <span className="text-sm text-default truncate">{task.title}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tip */}
      {!activeTask && focusTasks.length === 0 && (
        <EmptyState
          icon={TimerIcon}
          title="Ready when you are"
          description="Add tasks from the Today or Tasks tab, then pick one to focus on. The timer helps you work in short, concentrated bursts."
        />
      )}
    </div>
  );
}
