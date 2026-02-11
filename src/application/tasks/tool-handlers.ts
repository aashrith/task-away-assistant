import type { TaskService } from './task-service'
import type {
  AddTaskCommand,
  MarkTaskDoneCommand,
  DeleteTaskCommand,
  ListOverdueTasksQuery,
  RenameTaskCommand,
  ListTopPrioritiesQuery,
  DeleteAllTasksCommand,
  CompleteAllTasksCommand,
  ClearCompletedTasksCommand,
  UpdateTaskCommand,
  UpdateAllTasksPriorityCommand,
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

  async handleDeleteAllTasks(_args: DeleteAllTasksCommand): Promise<Response> {
    log('executing deleteAllTasks')
    const deletedCount = await this.taskService.deleteAllTasks({})
    return ResponseBuilder.response(TASK_MESSAGES.allTasksDeleted(deletedCount))
  }

  async handleCompleteAllTasks(_args: CompleteAllTasksCommand): Promise<Response> {
    log('executing completeAllTasks')
    const completed = await this.taskService.completeAllTasks({})
    return ResponseBuilder.response(TASK_MESSAGES.allTasksCompleted(completed.length))
  }

  async handleClearCompletedTasks(_args: ClearCompletedTasksCommand): Promise<Response> {
    log('executing clearCompletedTasks')
    const deletedCount = await this.taskService.clearCompletedTasks({})
    return ResponseBuilder.response(TASK_MESSAGES.completedTasksCleared(deletedCount))
  }

  async handleUpdateTask(args: UpdateTaskCommand): Promise<Response> {
    log('executing updateTask', { args })
    try {
      const task = await this.taskService.updateTask(args)
      const updates: string[] = []
      if (args.priority) updates.push(`priority to ${args.priority}`)
      if (args.dueDate !== undefined) updates.push(`due date`)
      if (args.description !== undefined) updates.push(`description`)
      const message = `Successfully updated task "${task.title}"${updates.length > 0 ? `: ${updates.join(', ')}` : ''}.`
      return ResponseBuilder.response(message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('not found')) {
        return ResponseBuilder.clarification(TASK_MESSAGES.taskNotFound(args.taskIdentifier))
      }
      throw error
    }
  }

  async handleUpdateAllTasksPriority(args: UpdateAllTasksPriorityCommand): Promise<Response> {
    log('executing updateAllTasksPriority', { args })
    const updated = await this.taskService.updateAllTasksPriority(args)
    const count = updated.length
    return ResponseBuilder.response(
      count === 0
        ? 'No tasks to update.'
        : `Successfully updated priority to ${args.priority} for ${count} task${count === 1 ? '' : 's'}.`
    )
  }
}
