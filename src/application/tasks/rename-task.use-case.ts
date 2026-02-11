import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { RenameTaskCommand } from '../../domain/task/task-commands'
import { TaskFinder } from './task-finder'

/**
 * Use case: Rename a task.
 */
export class RenameTaskUseCase {
  private readonly taskFinder: TaskFinder

  constructor(private readonly repository: TaskRepository) {
    this.taskFinder = new TaskFinder(repository)
  }

  async execute(command: RenameTaskCommand): Promise<Task> {
    const task = await this.taskFinder.findByIdentifier(command.taskIdentifier)

    if (!task) {
      throw new Error(`Task not found: ${command.taskIdentifier}`)
    }

    const updated = await this.repository.update({
      ...task,
      title: command.newTitle,
    })

    if (!updated) {
      throw new Error(`Failed to update task: ${command.taskIdentifier}`)
    }

    return updated
  }
}
