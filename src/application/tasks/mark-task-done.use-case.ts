import type { Task } from '../../domain/task/task'
import type { MarkTaskDoneCommand } from '../../domain/task/task-commands'
import { TaskFinder } from './task-finder'
import type { TaskRepository } from '../../domain/task/task-repository'
import { TASK_DEFAULTS } from '../ai/task-config'

/**
 * Use case: Mark a task as completed.
 */
export class MarkTaskDoneUseCase {
  private readonly finder: TaskFinder

  constructor(private readonly repository: TaskRepository) {
    this.finder = new TaskFinder(repository)
  }

  async execute(command: MarkTaskDoneCommand): Promise<Task> {
    const task = await this.finder.findByIdentifier(command.taskIdentifier)
    if (!task) {
      throw new Error(`Task not found: "${command.taskIdentifier}"`)
    }

    const updated = await this.repository.update({
      ...task,
      status: TASK_DEFAULTS.completedStatus,
    })

    if (!updated) {
      throw new Error(`Failed to update task: "${command.taskIdentifier}"`)
    }

    return updated
  }
}
