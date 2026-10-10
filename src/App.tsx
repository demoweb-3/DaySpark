import { useEffect, useMemo, useRef, useState } from 'react';
import { useTasks, type CreateTaskInput } from './hooks/useTasks';
import { useSettings } from './hooks/useSettings';
import { useTheme } from './hooks/useTheme';
import { useTimer, type TimerConfig } from './hooks/useTimer';
import { useToast } from './hooks/useToast';
import type { Task, ViewName } from './types';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { TaskEditor } from './components/TaskEditor';
import { TodayView } from './views/TodayView';
import { AllTasksView } from './views/AllTasksView';
import { FocusView } from './views/FocusView';
import { GentleResetView } from './views/GentleResetView';
import { SettingsView } from './views/SettingsView';
import { getOverdueTasks, getIncompleteTasks } from './utils/smartSort';

function App() {
  const [view, setView] = useState<ViewName>('today');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const prevViewRef = useRef(view);

  const { tasks, loading, error, createTask, createTasks, updateTask, toggleComplete, deleteTask, replaceAll, clearAll, clearCompleted } = useTasks();
  const { settings, updateSettings, replaceSettings } = useSettings();
  const { toasts, showToast, dismiss } = useToast();
  useTheme(settings.theme);

  const timerConfig: TimerConfig = useMemo(
    () => ({
      focusMinutes: settings.focusDurationMinutes,
      shortBreakMinutes: settings.shortBreakMinutes,
      longBreakMinutes: settings.longBreakMinutes,
      sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
      autoStartBreaks: settings.autoStartBreaks,
      soundEnabled: settings.soundEnabled,
    }),
    [settings]
  );

  const timer = useTimer(timerConfig);

  // Notify when focus session completes
  const prevSessionsRef = useRef(timer.completedFocusSessions);
  useEffect(() => {
    if (timer.completedFocusSessions > prevSessionsRef.current) {
      showToast('Focus session complete! Time for a break.', 'success');
    }
    prevSessionsRef.current = timer.completedFocusSessions;
  }, [timer.completedFocusSessions, showToast]);

  // Show storage errors
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error, showToast]);

  const overdueCount = useMemo(() => {
    return getOverdueTasks(tasks).length + getIncompleteTasks(tasks).filter((t) => !t.dueDate).length;
  }, [tasks]);

  function handleCreate(inputs: CreateTaskInput[]) {
    createTasks(inputs);
    const count = inputs.length;
    showToast(`Added ${count} ${count === 1 ? 'task' : 'tasks'}`, 'success');
  }

  function handleCreateSingle(input: CreateTaskInput) {
    createTask(input);
    showToast('Task added', 'success');
  }

  function handleUpdate(id: string, updates: Partial<Task>) {
    updateTask(id, updates);
    showToast('Task updated', 'success');
  }

  function handleToggle(id: string) {
    const task = tasks.find((t) => t.id === id);
    toggleComplete(id);
    if (task && !task.completed) {
      showToast('Task completed', 'success');
    }
  }

  function handleDelete(id: string) {
    deleteTask(id);
    showToast('Task deleted', 'info');
  }

  function handleEditFromCard(task: Task) {
    setEditingTask(task);
    setEditorOpen(true);
  }

  function handleFocusTask(id: string) {
    setFocusTaskId(id);
    timer.setActiveTask(id);
    setView('focus');
  }

  function handleEditorSave(id: string | null, updates: Partial<Task>) {
    if (id) {
      handleUpdate(id, updates);
    } else {
      handleCreateSingle({ title: updates.title ?? '', ...updates });
    }
  }

  function handleReplaceAll(newTasks: Task[]) {
    replaceAll(newTasks);
  }

  function handleClearAll() {
    clearAll();
    timer.setActiveTask(null);
  }

  function handleClearCompleted() {
    clearCompleted();
  }

  // Scroll to top on view change
  useEffect(() => {
    if (view !== prevViewRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      prevViewRef.current = view;
    }
  }, [view]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-spark-50 dark:bg-spark-900/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-spark-500 animate-pulse" />
          </div>
          <p className="text-sm text-muted">Loading your day...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-default flex flex-col">
      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-24">
        {view === 'today' && (
          <TodayView
            tasks={tasks}
            onCreate={handleCreate}
            onToggle={handleToggle}
            onEdit={handleEditFromCard}
            onDelete={handleDelete}
            onFocusTask={handleFocusTask}
          />
        )}
        {view === 'tasks' && (
          <AllTasksView
            tasks={tasks}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onFocusTask={handleFocusTask}
          />
        )}
        {view === 'focus' && (
          <FocusView
            tasks={tasks}
            timerConfig={timerConfig}
            timerState={{
              phase: timer.phase,
              status: timer.status,
              remainingSeconds: timer.remainingSeconds,
              totalSeconds: timer.totalSeconds,
              completedFocusSessions: timer.completedFocusSessions,
              activeTaskId: timer.activeTaskId,
            }}
            onTimerStart={timer.start}
            onTimerPause={timer.pause}
            onTimerResume={timer.resume}
            onTimerReset={timer.reset}
            onTimerSkip={timer.skipPhase}
            onTimerSwitchPhase={timer.switchPhase}
            onSetActiveTask={timer.setActiveTask}
            onToggleTask={handleToggle}
          />
        )}
        {view === 'reset' && (
          <GentleResetView
            tasks={tasks}
            onUpdate={handleUpdate}
            onToggle={handleToggle}
            onEdit={handleEditFromCard}
            onDelete={handleDelete}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            settings={settings}
            tasks={tasks}
            onUpdateSettings={updateSettings}
            onClearAll={handleClearAll}
            onClearCompleted={handleClearCompleted}
            onReplaceAll={handleReplaceAll}
            onReplaceSettings={replaceSettings}
            onToast={showToast}
          />
        )}
      </main>

      {/* Task Editor (global) */}
      <TaskEditor
        open={editorOpen}
        task={editingTask}
        onSave={handleEditorSave}
        onClose={() => {
          setEditorOpen(false);
          setEditingTask(null);
        }}
        onDelete={handleDelete}
      />

      {/* Bottom navigation */}
      <BottomNav active={view} onChange={setView} taskCount={overdueCount} />

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default App;
