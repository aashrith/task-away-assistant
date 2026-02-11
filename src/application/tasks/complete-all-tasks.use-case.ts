import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import { TASK_DEFAULTS } from '../ai/task-config'

/**
 * Use case: Mark all tasks as completed.
 */
export class CompleteAllTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(): Promise<Task[]> {
    const allTasks = await this.repository.list()
    const activeTasks = allTasks.filter((task) => task.status !== 'completed')
    const completed: Task[] = []

    for (const task of activeTasks) {
      const updated = await this.repository.update({
        ...task,
        status: TASK_DEFAULTS.completedStatus,
      })
      if (updated) {
        completed.push(updated)
      }
    }

    return completed
  }
}
