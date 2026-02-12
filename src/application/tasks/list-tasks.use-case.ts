import type { Task } from '../../domain/task/task'
import type { TaskRepository } from '../../domain/task/task-repository'
import type { ListTasksQuery } from '../../domain/task/task-commands'

/**
 * Use case: List tasks, optionally filtered by due-date range (timeframe or start/end).
 */
export class ListTasksUseCase {
  constructor(private readonly repository: TaskRepository) {}

  async execute(query: ListTasksQuery = {}): Promise<Task[]> {
    const all = await this.repository.list()
    const timeframe = query.timeframe?.toLowerCase().trim()
    const startDate = query.startDate?.trim() || undefined
    const endDate = query.endDate?.trim() || undefined

    if (startDate || endDate) {
      return this.filterByDateRange(all, startDate, endDate)
    }
    if (!timeframe) return all

    const now = new Date()
    return this.filterByTimeframe(all, timeframe, now)
  }

  private filterByDateRange(
    tasks: Task[],
    startDate?: string,
    endDate?: string
  ): Task[] {
    const start = startDate ? toDayStart(new Date(startDate)) : null
    const end = endDate ? toDayEnd(new Date(endDate)) : null

    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const due = new Date(task.dueDate)
      if (start != null && due < start) return false
      if (end != null && due > end) return false
      return true
    })
  }

  private filterByTimeframe(tasks: Task[], timeframe: string, now: Date): Task[] {
    if (timeframe === 'today') {
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)
      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const due = new Date(task.dueDate)
        return due >= startOfDay && due <= endOfDay
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
        const due = new Date(task.dueDate)
        return due >= startOfWeek && due <= endOfWeek
      })
    }
    return tasks
  }
}

function toDayStart(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

function toDayEnd(d: Date): Date {
  const out = new Date(d)
  out.setHours(23, 59, 59, 999)
  return out
}
