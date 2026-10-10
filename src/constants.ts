import type { Category, Priority, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  soundEnabled: true,
};

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  critical: 100,
  high: 60,
  medium: 30,
  low: 10,
};

export const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; bg: string; border: string; dot: string; text: string }
> = {
  critical: {
    label: 'Critical',
    color: 'clay',
    bg: 'bg-clay-100 dark:bg-clay-900/30',
    border: 'border-clay-300 dark:border-clay-700',
    dot: 'bg-clay-500',
    text: 'text-clay-600 dark:text-clay-400',
  },
  high: {
    label: 'High',
    color: 'spark',
    bg: 'bg-spark-100 dark:bg-spark-900/30',
    border: 'border-spark-300 dark:border-spark-700',
    dot: 'bg-spark-500',
    text: 'text-spark-600 dark:text-spark-400',
  },
  medium: {
    label: 'Medium',
    color: 'amber',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
  },
  low: {
    label: 'Low',
    color: 'sage',
    bg: 'bg-sage-100 dark:bg-sage-900/30',
    border: 'border-sage-300 dark:border-sage-700',
    dot: 'bg-sage-500',
    text: 'text-sage-600 dark:text-sage-400',
  },
};

export const CATEGORY_META: Record<
  Category,
  { label: string; icon: string }
> = {
  work: { label: 'Work', icon: 'Briefcase' },
  personal: { label: 'Personal', icon: 'Heart' },
  health: { label: 'Health', icon: 'Activity' },
  learning: { label: 'Learning', icon: 'BookOpen' },
  errands: { label: 'Errands', icon: 'ShoppingBag' },
  creative: { label: 'Creative', icon: 'Palette' },
  other: { label: 'Other', icon: 'Circle' },
};

export const CATEGORY_ORDER: Category[] = [
  'work',
  'personal',
  'health',
  'learning',
  'errands',
  'creative',
  'other',
];

export const DB_NAME = 'dayspark-db';
export const DB_VERSION = 1;
export const TASKS_STORE = 'tasks';
export const SETTINGS_STORE = 'settings';
export const SETTINGS_KEY = 'app-settings';
export const EXPORT_VERSION = 1;
export const FOCUS_STATE_KEY = 'dayspark-focus-state';
export const ONBOARDING_KEY = 'dayspark-onboarded';
