import { useCallback, useEffect, useRef, useState } from 'react';
import type { Settings, Task, ThemeMode } from '../types';
import { DEFAULT_SETTINGS, FOCUS_STATE_KEY, ONBOARDING_KEY } from '../constants';
import { dbGetAllTasks, dbGetSettings, dbPutTask, dbPutTasks, dbDeleteTask, dbClearTasks, dbPutSettings } from '../utils/db';
import { generateId, nowISO } from '../utils/helpers';

export interface CreateTaskInput {
  title: string;
  notes?: string;
  priority?: Task['priority'];
  category?: Task['category'];
  dueDate?: string | null;
  estimatedMinutes?: number | null;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const stored = await dbGetAllTasks();
        if (cancelled) return;
        setTasks(stored);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load tasks.');
      } finally {
        if (!cancelled) {
          loadedRef.current = true;
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const persistTask = useCallback(async (task: Task) => {
    try {
      await dbPutTask(task);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save task.');
    }
  }, []);

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      const now = nowISO();
      const task: Task = {
        id: generateId(),
        title: input.title.trim(),
        notes: input.notes?.trim() ?? '',
        priority: input.priority ?? 'medium',
        category: input.category ?? 'other',
        dueDate: input.dueDate ?? null,
        estimatedMinutes: input.estimatedMinutes ?? null,
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        order: Date.now(),
      };
      setTasks((prev) => [...prev, task]);
      await persistTask(task);
      return task;
    },
    [persistTask]
  );

  const createTasks = useCallback(
    async (inputs: CreateTaskInput[]): Promise<Task[]> => {
      const now = nowISO();
      const newTasks: Task[] = inputs.map((input, i) => ({
        id: generateId(),
        title: input.title.trim(),
        notes: input.notes?.trim() ?? '',
        priority: input.priority ?? 'medium',
        category: input.category ?? 'other',
        dueDate: input.dueDate ?? null,
        estimatedMinutes: input.estimatedMinutes ?? null,
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        order: Date.now() + i,
      }));
      setTasks((prev) => [...prev, ...newTasks]);
      try {
        await dbPutTasks(newTasks);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save tasks.');
      }
      return newTasks;
    },
    []
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>): Promise<void> => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const updated: Task = { ...t, ...updates, updatedAt: nowISO() };
          persistTask(updated);
          return updated;
        })
      );
    },
    [persistTask]
  );

  const toggleComplete = useCallback(
    async (id: string): Promise<void> => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const completed = !t.completed;
          const updated: Task = {
            ...t,
            completed,
            completedAt: completed ? nowISO() : null,
            updatedAt: nowISO(),
          };
          persistTask(updated);
          return updated;
        })
      );
    },
    [persistTask]
  );

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await dbDeleteTask(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete task.');
    }
  }, []);

  const replaceAll = useCallback(async (newTasks: Task[]): Promise<void> => {
    setTasks(newTasks);
    try {
      await dbClearTasks();
      if (newTasks.length > 0) {
        await dbPutTasks(newTasks);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to replace tasks.');
    }
  }, []);

  const clearAll = useCallback(async (): Promise<void> => {
    setTasks([]);
    try {
      await dbClearTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear tasks.');
    }
  }, []);

  const clearCompleted = useCallback(async (): Promise<void> => {
    const completed = tasks.filter((t) => t.completed);
    setTasks((prev) => prev.filter((t) => !t.completed));
    try {
      for (const t of completed) {
        await dbDeleteTask(t.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear completed tasks.');
    }
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    createTasks,
    updateTask,
    toggleComplete,
    deleteTask,
    replaceAll,
    clearAll,
    clearCompleted,
  };
}
