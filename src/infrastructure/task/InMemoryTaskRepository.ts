import type { Task, TaskId } from '../../domain/task/Task'
import { TaskRepository } from '../../domain/task/TaskRepository'

function nowIso(): string {
  return new Date().toISOString()
}

let idCounter = 0

function generateId(): TaskId {
  idCounter += 1
  return `task_${idCounter}`
}

/**
 * Simple in-memory TaskRepository.
 *
 * Intended for development, tests, and as a default
 * implementation before wiring up SQLite.
 */
export class InMemoryTaskRepository extends TaskRepository {
  private readonly tasks = new Map<TaskId, Task>()

  async add(task: Task): Promise<Task> {
    const id = task.id || generateId()
    const timestamp = nowIso()

    const stored: Task = {
      ...task,
      id,
      createdAt: task.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    this.tasks.set(id, stored)
    return stored
  }

  async getById(id: TaskId): Promise<Task | null> {
    return this.tasks.get(id) ?? null
  }

  async list(): Promise<Task[]> {
    return Array.from(this.tasks.values())
  }

  async update(task: Task): Promise<Task | null> {
    if (!this.tasks.has(task.id)) {
      return null
    }

    const existing = this.tasks.get(task.id)!
    const updated: Task = {
      ...existing,
      ...task,
      updatedAt: nowIso(),
    }

    this.tasks.set(task.id, updated)
    return updated
  }

  async delete(id: TaskId): Promise<boolean> {
    return this.tasks.delete(id)
  }
}

