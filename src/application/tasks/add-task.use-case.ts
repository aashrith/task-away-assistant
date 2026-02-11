import type { Task, TaskPriority } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { AddTaskCommand } from '../../domain/task/task-commands'
import { TASK_DEFAULTS } from '../ai/task-config'

/**
 * Use case: Add a new task.
 */
export class AddTaskUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(input: AddTaskCommand): Promise<Task> {
    const now = new Date().toISOString()
    const priority: TaskPriority = (input.priority ?? TASK_DEFAULTS.priority) as TaskPriority

    const task: Task = {
      id: '',
      title: input.title,
      description: input.description,
      status: TASK_DEFAULTS.status,
      priority,
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
      source: TASK_DEFAULTS.source,
    }

    return this.repository.add(task)
  }
}
