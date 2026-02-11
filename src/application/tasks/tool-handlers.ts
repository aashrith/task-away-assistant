import type { TaskService } from './task-service'
import type {
  AddTaskCommand,
  MarkTaskDoneCommand,
  DeleteTaskCommand,
  ListOverdueTasksQuery,
  RenameTaskCommand,
  ListTopPrioritiesQuery,
} from '../../domain/task/task-commands'
import { TASK_MESSAGES } from '../ai/task-config'
import { ResponseBuilder } from '../../infrastructure/http/response-builder'
import { createModuleLogger } from '../../infrastructure/logger'

const log = createModuleLogger('tool-handlers')

/**
 * Tool execution handlers for task operations.
 * Separates tool execution logic from API routing.
 */
export class ToolHandlers {
  constructor(private readonly taskService: TaskService) {}

  async handleAddTask(args: AddTaskCommand): Promise<Response> {
    log('executing addTask', { args })
    const task = await this.taskService.addFromInput(args)
    return ResponseBuilder.response(TASK_MESSAGES.taskCreated(task.title))
  }

  async handleListTasks(): Promise<Response> {
    log('executing listTasks')
    const tasks = await this.taskService.listTasks({})
    const formatted = this.taskService.formatTasksForChat(tasks)
    const message =
      tasks.length === 0 ? TASK_MESSAGES.noTasks : `${TASK_MESSAGES.taskListHeader}\n\n${formatted}`
    return ResponseBuilder.response(message)
  }

  async handleMarkTaskDone(args: MarkTaskDoneCommand): Promise<Response> {
    log('executing markTaskDone', { args })
    try {
      const task = await this.taskService.markTaskDone(args)
      return ResponseBuilder.response(TASK_MESSAGES.taskMarkedCompleted(task.title))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('not found')) {
        return ResponseBuilder.clarification(TASK_MESSAGES.taskNotFound(args.taskIdentifier))
      }
      throw error
    }
  }

  async handleDeleteTask(args: DeleteTaskCommand): Promise<Response> {
    log('executing deleteTask', { args })
    try {
      const deleted = await this.taskService.deleteTask(args)
      if (deleted) {
        return ResponseBuilder.response(TASK_MESSAGES.taskDeleted)
      }
      throw new Error('Failed to delete task')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('not found')) {
        return ResponseBuilder.clarification(TASK_MESSAGES.taskNotFound(args.taskIdentifier))
      }
      throw error
    }
  }

  async handleListOverdueTasks(args: ListOverdueTasksQuery): Promise<Response> {
    log('executing listOverdueTasks', { args })
    const tasks = await this.taskService.listOverdueTasks(args)
    const formatted = this.taskService.formatTasksForChat(tasks)
    const message =
      tasks.length === 0
        ? TASK_MESSAGES.noOverdueTasks
        : `${TASK_MESSAGES.overdueTasksHeader}\n\n${formatted}`
    return ResponseBuilder.response(message)
  }

  async handleRenameTask(args: RenameTaskCommand): Promise<Response> {
    log('executing renameTask', { args })
    try {
      const task = await this.taskService.renameTask(args)
      return ResponseBuilder.response(TASK_MESSAGES.taskRenamed(task.title))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('not found')) {
        return ResponseBuilder.clarification(TASK_MESSAGES.taskNotFound(args.taskIdentifier))
      }
      throw error
    }
  }

  async handleListTopPriorities(args: ListTopPrioritiesQuery): Promise<Response> {
    log('executing listTopPriorities', { args })
    const tasks = await this.taskService.listTopPriorities(args)
    const formatted = this.taskService.formatTasksForChat(tasks)
    const message =
      tasks.length === 0
        ? TASK_MESSAGES.noTopPriorities
        : `${TASK_MESSAGES.topPrioritiesHeader}\n\n${formatted}`
    return ResponseBuilder.response(message)
  }
}
