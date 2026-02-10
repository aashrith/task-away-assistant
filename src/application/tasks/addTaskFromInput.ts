import type { Task, TaskPriority } from '../../domain/task/Task'
import type { TaskRepository } from '../../domain/task/TaskRepository'

export interface AddTaskCommand {
  title: string
  description?: string
  priority?: TaskPriority
  /**
   * Optional due date as ISO-8601 string.
   */
  dueDate?: string
}

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  async addFromInput(input: AddTaskCommand): Promise<Task> {
    const now = new Date().toISOString()
    const priority: TaskPriority = input.priority ?? 'medium'

    const task: Task = {
      id: '',
      title: input.title,
      description: input.description,
      status: 'pending',
      priority,
      dueDate: input.dueDate,
      createdAt: now,
      updatedAt: now,
      source: 'assistant',
    }

    return this.repository.add(task)
  }
}


