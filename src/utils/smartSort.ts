import { PRIORITY_WEIGHTS } from '../constants';
import type { Task } from '../types';
import { daysUntilDue, isOverdue } from './helpers';

/**
 * Smart Sort — transparent, deterministic priority scoring.
 *
 * Each task gets a score (higher = more urgent/important):
 *   1. Overdue penalty: tasks past their due date get a big urgency boost.
 *   2. Due proximity: tasks due today or soon get an urgency boost.
 *   3. Priority weight: critical > high > medium > low.
 *   4. Estimated effort: shorter tasks get a small boost (knock out quick wins).
 *   5. Recency tiebreaker: newer tasks slightly preferred.
 *
 * No machine learning, no opaque signals — just these rules, applied in order.
 */
export function computeScore(task: Task): number {
  let score = 0;

  // Priority base weight (10–100)
  score += PRIORITY_WEIGHTS[task.priority];

  // Due date urgency
  if (task.dueDate) {
    const days = daysUntilDue(task.dueDate);

    if (days < 0) {
      // Overdue: the further overdue, the more urgent (capped)
      score += 80 + Math.min(Math.abs(days) * 5, 40);
    } else if (days === 0) {
      // Due today
      score += 70;
    } else if (days === 1) {
      // Due tomorrow
      score += 50;
    } else if (days <= 3) {
      // Due within 3 days
      score += 35;
    } else if (days <= 7) {
      // Due within a week
      score += 20;
    } else {
      // Far future — small boost so it's above no-date
      score += 5;
    }
  }

  // Effort boost: quick tasks get a small advantage
  if (task.estimatedMinutes && task.estimatedMinutes <= 15) {
    score += 8;
  } else if (task.estimatedMinutes && task.estimatedMinutes <= 30) {
    score += 4;
  }

  return score;
}

/**
 * Sort tasks by smart score (descending), then by creation order for stability.
 * Only incomplete tasks are scored; completed tasks go to the bottom.
 */
export function smartSort(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Completed tasks always at the bottom
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.completed && b.completed) {
      // Most recently completed first
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    }

    const aScore = computeScore(a);
    const bScore = computeScore(b);

    if (aScore !== bScore) return bScore - aScore;

    // Tiebreaker: original creation order
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

/**
 * Get the top N priority tasks (incomplete only).
 */
export function getTopPriorities(tasks: Task[], n: number): Task[] {
  return smartSort(tasks.filter((t) => !t.completed)).slice(0, n);
}

/**
 * Get tasks due today (incomplete).
 */
export function getTodaysTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.completed && t.dueDate === todayISODate());
}

/**
 * Get overdue tasks (incomplete, due date before today).
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.completed && isOverdue(t.dueDate));
}

function todayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get incomplete tasks.
 */
export function getIncompleteTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.completed);
}

/**
 * Calculate remaining workload in minutes (incomplete tasks with estimates).
 */
export function getRemainingWorkload(tasks: Task[]): number {
  return tasks
    .filter((t) => !t.completed && t.estimatedMinutes)
    .reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
}

/**
 * Calculate completion progress for today.
 */
export function getTodayProgress(tasks: Task[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const today = todayISODate();
  const todays = tasks.filter((t) => t.dueDate === today);
  const completed = todays.filter((t) => t.completed).length;
  const total = todays.length;
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
