import { InMemoryTaskRepository } from '../src/infrastructure/task/in-memory-task-repository'
import { TaskService } from '../src/application/tasks/task-service'

/**
 * Task service context for server-side usage.
 *
 * Creates and exports a singleton TaskService instance with an in-memory repository.
 * This is used by API handlers and route loaders.
 */
const taskRepository = new InMemoryTaskRepository()
export const taskService = new TaskService(taskRepository)
