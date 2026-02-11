import type { DeleteTaskCommand } from '../../domain/task/task-commands'
import { TaskFinder } from './task-finder'
import type { TaskRepository } from '../../domain/task/task-repository'

/**
 * Use case: Delete a task.
 */
export class DeleteTaskUseCase {
  private readonly finder: TaskFinder

  constructor(private readonly repository: TaskRepository) {
    this.finder = new TaskFinder(repository)
  }

  async execute(command: DeleteTaskCommand): Promise<boolean> {
    const task = await this.finder.findByIdentifier(command.taskIdentifier)
    if (!task) {
      throw new Error(`Task not found: "${command.taskIdentifier}"`)
    }

    return this.repository.delete(task.id)
  }
}
