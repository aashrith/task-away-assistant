import type { EventHandler } from 'h3'

import type { TaskService } from '../../../src/application/tasks/task-service'
import { createModuleLogger } from '../../../src/infrastructure/logger'

const log = createModuleLogger('tasks-handler')

export interface TasksHandlerDependencies {
  taskService: TaskService
}

export interface TasksResponse {
  tasks: Awaited<ReturnType<TaskService['listTasks']>>
}

/**
 * Class-based handler for tasks API requests.
 *
 * Responsibilities:
 * - Handle GET requests for task listing
 * - Delegate to task service for business logic
 * - Return properly typed response
 */
export class TasksHandler {
  constructor(private readonly dependencies: TasksHandlerDependencies) {}

  /**
   * Creates an H3 event handler for tasks GET requests.
   * @returns EventHandler function that returns tasks list
   */
  createHandler(): EventHandler {
    return async (): Promise<TasksResponse> => {
      log('request')
      const tasks = await this.dependencies.taskService.listTasks({})
      return { tasks }
    }
  }
}
