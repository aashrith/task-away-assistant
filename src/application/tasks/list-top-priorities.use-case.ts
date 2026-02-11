import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { ListTopPrioritiesQuery } from '../../domain/task/task-commands'

const DEFAULT_LIMIT = 3
const DEFAULT_TIMEFRAME = 'today'

/**
 * Use case: List top priority tasks for a given timeframe.
 * Returns tasks sorted by priority (high > medium > low), then by due date.
 */
export class ListTopPrioritiesUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(query: ListTopPrioritiesQuery = {}): Promise<Task[]> {
    // Validate and sanitize limit
    let limit = query.limit ?? DEFAULT_LIMIT
    if (!Number.isFinite(limit) || limit <= 0) {
      limit = DEFAULT_LIMIT
    }
    // Cap at reasonable maximum
    if (limit > 100) {
      limit = 100
    }

    const timeframe = query.timeframe ?? DEFAULT_TIMEFRAME

    const allTasks = await this.repository.list()

    // Filter by timeframe
    const now = new Date()
    const filteredTasks = this.filterByTimeframe(allTasks, timeframe, now)

    // Filter out completed tasks
    const activeTasks = filteredTasks.filter((task) => task.status !== 'completed')

    // Sort by priority (high > medium > low), then by due date
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
    const sorted = activeTasks.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // If same priority, sort by due date (earlier first, nulls last)
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

    return sorted.slice(0, limit)
  }

  private filterByTimeframe(tasks: Task[], timeframe: string, now: Date): Task[] {
    if (timeframe === 'today') {
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)

      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= startOfDay && dueDate <= endOfDay
      })
    }

    if (timeframe === 'this week') {
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)

      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= startOfWeek && dueDate <= endOfWeek
      })
    }

    // If timeframe not recognized, default to "today" behavior
    // This ensures we don't return all tasks for invalid timeframes
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= startOfDay && dueDate <= endOfDay
    })
  }
}
