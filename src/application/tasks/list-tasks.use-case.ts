import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { ListTasksQuery } from '../../domain/task/task-commands'

/**
 * Use case: List all tasks.
 */
export class ListTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(_query: ListTasksQuery = {}): Promise<Task[]> {
    return this.repository.list()
  }
}
