import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'

/**
 * Utility for finding tasks by identifier (id or title).
 */
export class TaskFinder {
  constructor(private readonly repository: TaskRepository) {}

  /**
   * Find a task by identifier (id or title).
   * Returns null if not found.
   */
  async findByIdentifier(identifier: string): Promise<Task | null> {
    // Try by ID first
    const byId = await this.repository.getById(identifier)
    if (byId) return byId

    // Try by title (case-insensitive partial match)
    const allTasks = await this.repository.list()
    const normalized = identifier.toLowerCase().trim()
    return (
      allTasks.find(
        (t) => t.title.toLowerCase().includes(normalized) || normalized.includes(t.title.toLowerCase())
      ) ?? null
    )
  }
}
