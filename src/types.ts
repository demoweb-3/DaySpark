export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Category = 'work' | 'personal' | 'health' | 'learning' | 'errands' | 'creative' | 'other';

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  category: Category;
  dueDate: string | null; // ISO date string (yyyy-mm-dd)
  estimatedMinutes: number | null;
  completed: boolean;
  completedAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  order: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  theme: ThemeMode;
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  soundEnabled: boolean;
}

export type ViewName = 'today' | 'tasks' | 'focus' | 'reset' | 'settings';

export type FilterType = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'no-date';

export interface ExportData {
  app: 'DaySpark';
  version: number;
  exportedAt: string;
  tasks: Task[];
  settings: Settings | null;
}
