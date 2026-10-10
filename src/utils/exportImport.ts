import { EXPORT_VERSION, DEFAULT_SETTINGS } from '../constants';
import type { ExportData, Settings, Task, Category, Priority } from '../types';
import { generateId, nowISO } from './helpers';

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const VALID_CATEGORIES: Category[] = [
  'work', 'personal', 'health', 'learning', 'errands', 'creative', 'other',
];

/**
 * Validate and normalize a task object from imported data.
 * Returns a valid Task, or null if the input is irreparably invalid.
 */
function validateTask(raw: unknown): Task | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  if (!title) return null;

  const priority = VALID_PRIORITIES.includes(obj.priority as Priority)
    ? (obj.priority as Priority)
    : 'medium';

  const category = VALID_CATEGORIES.includes(obj.category as Category)
    ? (obj.category as Category)
    : 'other';

  const dueDate =
    typeof obj.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.dueDate)
      ? obj.dueDate
      : null;

  const estimatedMinutes =
    typeof obj.estimatedMinutes === 'number' && obj.estimatedMinutes >= 0 && obj.estimatedMinutes <= 1440
      ? Math.round(obj.estimatedMinutes)
      : null;

  const completed = obj.completed === true;
  const now = nowISO();

  return {
    id: typeof obj.id === 'string' && obj.id.length > 0 ? obj.id : generateId(),
    title,
    notes: typeof obj.notes === 'string' ? obj.notes : '',
    priority,
    category,
    dueDate,
    estimatedMinutes,
    completed,
    completedAt: typeof obj.completedAt === 'string' ? obj.completedAt : null,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : now,
    updatedAt: now,
    order: typeof obj.order === 'number' ? obj.order : Date.now(),
  };
}

function validateSettings(raw: unknown): Settings | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  return {
    theme: obj.theme === 'light' || obj.theme === 'dark' || obj.theme === 'system'
      ? (obj.theme as Settings['theme'])
      : DEFAULT_SETTINGS.theme,
    focusDurationMinutes: typeof obj.focusDurationMinutes === 'number'
      ? Math.max(1, Math.min(120, Math.round(obj.focusDurationMinutes)))
      : DEFAULT_SETTINGS.focusDurationMinutes,
    shortBreakMinutes: typeof obj.shortBreakMinutes === 'number'
      ? Math.max(1, Math.min(60, Math.round(obj.shortBreakMinutes)))
      : DEFAULT_SETTINGS.shortBreakMinutes,
    longBreakMinutes: typeof obj.longBreakMinutes === 'number'
      ? Math.max(1, Math.min(120, Math.round(obj.longBreakMinutes)))
      : DEFAULT_SETTINGS.longBreakMinutes,
    sessionsBeforeLongBreak: typeof obj.sessionsBeforeLongBreak === 'number'
      ? Math.max(1, Math.min(10, Math.round(obj.sessionsBeforeLongBreak)))
      : DEFAULT_SETTINGS.sessionsBeforeLongBreak,
    autoStartBreaks: typeof obj.autoStartBreaks === 'boolean'
      ? obj.autoStartBreaks
      : DEFAULT_SETTINGS.autoStartBreaks,
    soundEnabled: typeof obj.soundEnabled === 'boolean'
      ? obj.soundEnabled
      : DEFAULT_SETTINGS.soundEnabled,
  };
}

export interface ImportResult {
  success: boolean;
  tasks: Task[];
  settings: Settings | null;
  error?: string;
  skipped: number;
}

/**
 * Parse and validate imported JSON data.
 */
export function parseImportData(jsonText: string): ImportResult {
  let data: unknown;

  try {
    data = JSON.parse(jsonText);
  } catch {
    return {
      success: false,
      tasks: [],
      settings: null,
      error: 'The file is not valid JSON. Please check the file and try again.',
      skipped: 0,
    };
  }

  if (!data || typeof data !== 'object') {
    return {
      success: false,
      tasks: [],
      settings: null,
      error: 'The file does not contain valid data.',
      skipped: 0,
    };
  }

  const obj = data as Record<string, unknown>;

  if (obj.app !== 'DaySpark') {
    return {
      success: false,
      tasks: [],
      settings: null,
      error: 'This file was not created by DaySpark and cannot be imported.',
      skipped: 0,
    };
  }

  const rawTasks = Array.isArray(obj.tasks) ? obj.tasks : [];

  const validTasks: Task[] = [];
  let skipped = 0;

  for (const raw of rawTasks) {
    const task = validateTask(raw);
    if (task) {
      validTasks.push(task);
    } else {
      skipped++;
    }
  }

  // Deduplicate by id, keeping the last occurrence
  const byId = new Map<string, Task>();
  for (const t of validTasks) {
    byId.set(t.id, t);
  }

  const settings = validateSettings(obj.settings);

  return {
    success: true,
    tasks: Array.from(byId.values()),
    settings,
    skipped,
  };
}

/**
 * Build the export data object.
 */
export function buildExportData(tasks: Task[], settings: Settings | null): ExportData {
  return {
    app: 'DaySpark',
    version: EXPORT_VERSION,
    exportedAt: nowISO(),
    tasks,
    settings,
  };
}

/**
 * Trigger a download of the export data as a JSON file.
 */
export function downloadExport(tasks: Task[], settings: Settings | null): void {
  const data = buildExportData(tasks, settings);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dayspark-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
