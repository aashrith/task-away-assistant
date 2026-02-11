import type { Task, TaskPriority } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { UpdateTaskCommand } from '../../domain/task/task-commands'
import { TaskFinder } from './task-finder'

/**
 * Use case: Update an existing task's properties (priority, dueDate, description).
 */
export class UpdateTaskUseCase {
  constructor(
    private readonly repository: TaskRepository,
    private readonly finder: TaskFinder
  ) {}

  async execute(command: UpdateTaskCommand): Promise<Task> {
    const task = await this.finder.findByIdentifier(command.taskIdentifier)
    if (!task) {
      throw new Error(`Task not found: ${command.taskIdentifier}`)
    }

    const updates: Partial<Task> = {
      updatedAt: new Date().toISOString(),
    }

    if (command.priority) {
      updates.priority = command.priority as TaskPriority
    }

    if (command.dueDate !== undefined) {
      updates.dueDate = command.dueDate || undefined
    }

    if (command.description !== undefined) {
      updates.description = command.description || undefined
    }

    const updated = { ...task, ...updates }
    const result = await this.repository.update(updated)
    
    if (!result) {
      throw new Error(`Failed to update task: ${command.taskIdentifier}`)
    }

    return result
  }
}
