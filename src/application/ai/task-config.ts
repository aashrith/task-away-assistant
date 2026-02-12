/**
 * Task-specific configuration: defaults, labels, limits, and task-related messages.
 */

/** Max tasks allowed in the system (prevents abuse). */
export const MAX_TOTAL_TASKS = 500

/** Max tasks that can be added in a single user message (per request). */
export const MAX_ADDS_PER_MESSAGE = 10

export const TASK_DEFAULTS = {
  priority: 'medium' as const,
  status: 'pending' as const,
  source: 'assistant' as const,
  completedStatus: 'completed' as const,
} as const

export const TASK_STATUS_LABELS: Record<string, string> = {
  completed: '[completed]',
  in_progress: '[in progress]',
  pending: '[pending]',
}

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  high: '[high]',
  medium: '[medium]',
  low: '[low]',
}

export const TASK_MESSAGES = {
  noTasksFound: 'No tasks found.',
  noTasks: 'You have no tasks.',
  noOverdueTasks: 'You have no overdue tasks. Great job!',
  noTasksDueToday: 'You have no tasks due today.',
  noTasksDueThisWeek: 'You have no tasks due this week.',
  noTasksInDateRange: 'No tasks fall within that date range.',
  noTopPriorities: 'You have no priority tasks for this timeframe.',
  taskCreated: (title: string) => `Task "${title}" created successfully.`,
  taskMarkedCompleted: (title: string) => `Task "${title}" marked as completed.`,
  taskDeleted: 'Task deleted successfully.',
  taskRenamed: (newTitle: string) => `Task renamed to "${newTitle}" successfully.`,
  taskNotFound: (identifier: string) =>
    `I couldn't find a task matching "${identifier}". Please check the task name or try listing your tasks first.`,
  taskListHeader: 'Here are your tasks:',
  overdueTasksHeader: 'Here are your overdue tasks:',
  topPrioritiesHeader: 'Here are your top priority tasks:',
  allTasksDeleted: (count: number) =>
    count === 0
      ? 'No tasks to delete.'
      : `Successfully deleted ${count} task${count === 1 ? '' : 's'}.`,
  allTasksCompleted: (count: number) =>
    count === 0
      ? 'No active tasks to complete.'
      : `Successfully marked ${count} task${count === 1 ? '' : 's'} as completed.`,
  completedTasksCleared: (count: number) =>
    count === 0
      ? 'No completed tasks to clear.'
      : `Successfully cleared ${count} completed task${count === 1 ? '' : 's'}.`,
  tooManyTasksTotal: (max: number) =>
    `Task limit reached (max ${max} tasks). Delete or clear completed tasks to add more.`,
  tooManyAddsThisMessage: (max: number) =>
    `You can add at most ${max} tasks per message. Add the first ${max}, then send another message for more.`,
} as const
