import type { Task, TaskId } from '../../domain/task/task'
import { TaskRepository } from '../../domain/task/task-repository'
import { createModuleLogger } from '../logger'

const INITIAL_ID_COUNTER = 0
const ID_INCREMENT = 1

function nowIso(): string {
  return new Date().toISOString()
}

let idCounter = INITIAL_ID_COUNTER

function generateId(): TaskId {
  idCounter += ID_INCREMENT
  return `task_${idCounter}`
}

const log = createModuleLogger('repository')

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
    log('add', { id, title: stored.title, status: stored.status })
    return stored
  }

  async getById(id: TaskId): Promise<Task | null> {
    const task = this.tasks.get(id) ?? null
    log('getById', { id, found: !!task })
    return task
  }

  async list(): Promise<Task[]> {
    const tasks = Array.from(this.tasks.values())
    log('list', { count: tasks.length })
    return tasks
  }

  async update(task: Task): Promise<Task | null> {
    if (!this.tasks.has(task.id)) {
      log('update', { id: task.id, found: false })
      return null
    }

    const existing = this.tasks.get(task.id)!
    const updated: Task = {
      ...existing,
      ...task,
      updatedAt: nowIso(),
    }

    this.tasks.set(task.id, updated)
    log('update', { id: task.id, title: updated.title, status: updated.status })
    return updated
  }

  async delete(id: TaskId): Promise<boolean> {
    const deleted = this.tasks.delete(id)
    log('delete', { id, deleted })
    return deleted
  }
}

