import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'

/**
 * Utility for finding tasks by identifier (id or title).
 */
export class TaskFinder {
  constructor(private readonly repository: TaskRepository) {}

  /**
   * Find all candidate tasks matching an identifier (id or title fragment).
   * Used for ambiguity checks and clarification messages.
   */
  async findCandidates(identifier: string): Promise<Task[]> {
    const normalized = identifier.toLowerCase().trim()
    if (!normalized) return []

    // Try exact id match first
    const byId = await this.repository.getById(identifier)
    const allTasks = await this.repository.list()

    const titleMatches = allTasks.filter((t) =>
      t.title.toLowerCase().includes(normalized) ||
      normalized.includes(t.title.toLowerCase())
    )

    const candidates = byId ? [byId, ...titleMatches.filter((t) => t.id !== byId.id)] : titleMatches

    // De-duplicate by id
    const seen = new Set<string>()
    const unique: Task[] = []
    for (const task of candidates) {
      if (seen.has(task.id)) continue
      seen.add(task.id)
      unique.push(task)
    }

    return unique
  }

  /**
   * Find a task by identifier (id or title).
   * Returns null if not found.
   */
  async findByIdentifier(identifier: string): Promise<Task | null> {
    const candidates = await this.findCandidates(identifier)
    return candidates[0] ?? null
  }
}
