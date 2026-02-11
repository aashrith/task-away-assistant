import { InMemoryTaskRepository } from '../src/infrastructure/task/in-memory-task-repository'
import { TaskService } from '../src/application/tasks/task-service'

const taskRepo = new InMemoryTaskRepository()
export const taskService = new TaskService(taskRepo)

