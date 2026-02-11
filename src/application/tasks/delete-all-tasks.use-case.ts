import type { TaskRepository } from '../../domain/task/task-repository'

/**
 * Use case: Delete all tasks.
 */
export class DeleteAllTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(): Promise<number> {
    const allTasks = await this.repository.list()
    let deletedCount = 0

    for (const task of allTasks) {
      const deleted = await this.repository.delete(task.id)
      if (deleted) {
        deletedCount++
      }
    }

    return deletedCount
  }
}
