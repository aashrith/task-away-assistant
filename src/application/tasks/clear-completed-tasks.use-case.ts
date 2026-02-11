import type { TaskRepository } from '../../domain/task/task-repository'

/**
 * Use case: Delete all completed tasks.
 */
export class ClearCompletedTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(): Promise<number> {
    const allTasks = await this.repository.list()
    const completedTasks = allTasks.filter((task) => task.status === 'completed')
    let deletedCount = 0

    for (const task of completedTasks) {
      const deleted = await this.repository.delete(task.id)
      if (deleted) {
        deletedCount++
      }
    }

    return deletedCount
  }
}
