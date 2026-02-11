import type { Task, TaskPriority } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { UpdateAllTasksPriorityCommand } from '../../domain/task/task-commands'

/**
 * Use case: Update priority for all tasks.
 */
export class UpdateAllTasksPriorityUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(command: UpdateAllTasksPriorityCommand): Promise<Task[]> {
    const allTasks = await this.repository.list()
    const updatedTasks: Task[] = []

    for (const task of allTasks) {
      const updated: Task = {
        ...task,
        priority: command.priority as TaskPriority,
        updatedAt: new Date().toISOString(),
      }
      const result = await this.repository.update(updated)
      if (result) {
        updatedTasks.push(result)
      }
    }

    return updatedTasks
  }
}
