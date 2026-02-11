import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { ListOverdueTasksQuery } from '../../domain/task/task-commands'
import { TASK_DEFAULTS } from '../ai/task-config'

/**
 * Use case: List overdue tasks (due date is in the past and status is not completed).
 */
export class ListOverdueTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(_query: ListOverdueTasksQuery = {}): Promise<Task[]> {
    const now = new Date()
    const allTasks = await this.repository.list()

    return allTasks.filter((task) => {
      // Must have a due date
      if (!task.dueDate) return false

      // Must not be completed
      if (task.status === TASK_DEFAULTS.completedStatus) return false

      // Due date must be in the past
      const dueDate = new Date(task.dueDate)
      return dueDate < now
    })
  }
}
