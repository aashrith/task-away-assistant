import type { Task } from '../../domain/task/task'
import { TASK_MESSAGES, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../ai/task-config'

/**
 * Utility for formatting tasks for display in chat.
 */
export class TaskFormatter {
  /**
   * Format tasks for chat display.
   */
  formatTasksForChat(tasks: Task[]): string {
    if (tasks.length === 0) {
      return TASK_MESSAGES.noTasksFound
    }

    return tasks
      .map((task, index) => {
        const statusLabel = TASK_STATUS_LABELS[task.status] || `[${task.status}]`
        const priorityLabel = TASK_PRIORITY_LABELS[task.priority] || `[${task.priority}]`
        const dueDateStr = task.dueDate ? ` (due: ${new Date(task.dueDate).toLocaleDateString()})` : ''
        const descStr = task.description ? `\n   ${task.description}` : ''
        return `${index + 1}. ${statusLabel} ${priorityLabel} **${task.title}**${dueDateStr}${descStr}`
      })
      .join('\n\n')
  }
}
