import type { EventHandler } from 'h3'
import { HTTPError } from 'h3'

import type { TaskService } from '../../../src/application/tasks/task-service'
import type { Task } from '../../../src/domain/task/task'
import { createModuleLogger } from '../../../src/infrastructure/logger'
import { HTTP_STATUS, ERROR_MESSAGES, ERROR_CODES } from '../../../src/infrastructure/http/http-constants'

const log = createModuleLogger('tasks-handler')

export interface TasksHandlerDependencies {
  taskService: TaskService
}

export interface TasksResponse {
  tasks: Task[]
}

/**
 * Handles GET /api/tasks: returns the full task list.
 * Errors are thrown as HTTPError for H3 to serialize.
 */
export class TasksHandler {
  constructor(private readonly dependencies: TasksHandlerDependencies) {}

  createHandler(): EventHandler {
    return async (): Promise<TasksResponse> => {
      try {
        log('request')
        const tasks = await this.dependencies.taskService.listTasks({})
        log('response', { count: tasks.length })
        return { tasks }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log('error', { error: message })
        throw new HTTPError({
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          statusText: ERROR_MESSAGES.INTERNAL_ERROR,
          message: ERROR_MESSAGES.INTERNAL_ERROR,
          data: { code: ERROR_CODES.INTERNAL_ERROR },
        })
      }
    }
  }
}
