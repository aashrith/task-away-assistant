import { InMemoryTaskRepository } from '../src/infrastructure/task/in-memory-task-repository'
import { TaskService } from '../src/application/tasks/task-service'

/**
 * Server-side task context: singleton TaskService backed by in-memory storage.
 * Used by POST /api/chat and GET /api/tasks. Replace InMemoryTaskRepository
 * with a persistent implementation (e.g. DB) for production.
 */
const taskRepository = new InMemoryTaskRepository()
export const taskService = new TaskService(taskRepository)
