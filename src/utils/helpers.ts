/**
 * Generate a unique ID using crypto.randomUUID with a fallback.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Get today's date as yyyy-mm-dd (local time, not UTC).
 */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get the current ISO datetime string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Format a yyyy-mm-dd date for display.
 */
export function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  if (inputDate.getTime() === today.getTime()) return 'Today';
  if (inputDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (inputDate.getTime() === yesterday.getTime()) return 'Yesterday';

  const diffDays = Math.round((inputDate.getTime() - today.getTime()) / 86400000);

  if (diffDays > 0 && diffDays <= 6) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 300 ? 'numeric' : undefined });
}

/**
 * Get the number of days until/since a due date (negative = overdue).
 */
export function daysUntilDue(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

/**
 * Check if a due date is today.
 */
export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return daysUntilDue(dateStr) === 0;
}

/**
 * Check if a due date is overdue (before today).
 */
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return daysUntilDue(dateStr) < 0;
}

/**
 * Format minutes into a human-readable duration.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format seconds into MM:SS or HH:MM:SS.
 */
export function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
