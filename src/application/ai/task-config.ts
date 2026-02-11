/**
 * Task-specific configuration: defaults, labels, and task-related messages.
 */

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
} as const
