import type { Task } from '../../domain/task/task'
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
import type { TaskExecutionContext } from './execution-context'
import { isPronounIdentifier } from './task-identifier-config'
import {
  TASK_MESSAGES,
  MAX_TOTAL_TASKS,
  MAX_ADDS_PER_MESSAGE,
} from '../ai/task-config'
import { ResponseBuilder } from '../../infrastructure/http/response-builder'
import { createModuleLogger } from '../../infrastructure/logger'

const log = createModuleLogger('tool-handlers')

/**
 * Tool execution handlers for task operations.
 * Uses request-scoped execution context so "that"/"it"/"this" resolve to the last affected task.
 */
export class ToolHandlers {
  constructor(
    private readonly taskService: TaskService,
    private readonly executionContext?: TaskExecutionContext
  ) {}

  /**
   * Resolve a user-provided task identifier to a specific task, or
   * return a clarification response when ambiguous.
   */
  private async resolveTaskIdentifier(
    identifier: string,
    actionLabel: string
  ): Promise<{ task: Task | null; clarification?: Response }> {
    const isPronoun = isPronounIdentifier(identifier)
    let candidates = await this.taskService.findTasksByIdentifier(identifier)

    if (candidates.length === 0 && isPronoun && this.executionContext?.lastAffectedTaskId) {
      const byLastAffected = await this.taskService.findTasksByIdentifier(
        this.executionContext.lastAffectedTaskId
      )
      if (byLastAffected.length === 1) {
        return { task: byLastAffected[0], clarification: undefined }
      }
    }

    if (candidates.length === 0 && isPronoun) {
      const allTasks = await this.taskService.listTasks({})
      if (allTasks.length === 1) {
        return { task: allTasks[0], clarification: undefined }
      }
      if (allTasks.length === 0) {
        return {
          task: null,
          clarification: ResponseBuilder.clarification('There are no tasks yet. Add one first.'),
        }
      }
      const previewLines = allTasks
        .slice(0, 5)
        .map((t, i) => `${i + 1}. ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ''}`)
        .join('\n')
      return {
        task: null,
        clarification: ResponseBuilder.clarification(
          `You have ${allTasks.length} tasks. Which one do you mean?\n\n${previewLines}\n\nReply with the exact task title.`
        ),
      }
    }

    if (candidates.length === 0) {
      return {
        task: null,
        clarification: ResponseBuilder.clarification(TASK_MESSAGES.taskNotFound(identifier)),
      }
    }

    if (candidates.length === 1) {
      return { task: candidates[0], clarification: undefined }
    }

    const previewLines = candidates
      .slice(0, 5)
      .map((task, index) => {
        const parts: string[] = [`${index + 1}. ${task.title}`]
        if (task.dueDate) parts.push(`(due ${new Date(task.dueDate).toLocaleDateString()})`)
        if (task.priority) parts.push(`[${task.priority}]`)
        return parts.join(' ')
      })
      .join('\n')

    const message = [
      `I found several tasks matching "${identifier}" for ${actionLabel}:`,
      '',
      previewLines,
      '',
      'Which one do you mean? Reply with the exact task title.',
    ].join('\n')

    return { task: null, clarification: ResponseBuilder.clarification(message) }
  }

  async handleAddTask(args: AddTaskCommand): Promise<Response> {
    log('executing addTask', { args })

    const currentCount = (await this.taskService.listTasks({})).length
    if (currentCount >= MAX_TOTAL_TASKS) {
      return ResponseBuilder.clarification(TASK_MESSAGES.tooManyTasksTotal(MAX_TOTAL_TASKS))
    }

    if (this.executionContext && this.executionContext.addTaskCallsThisRequest >= MAX_ADDS_PER_MESSAGE) {
      return ResponseBuilder.clarification(TASK_MESSAGES.tooManyAddsThisMessage(MAX_ADDS_PER_MESSAGE))
    }

    const task = await this.taskService.addFromInput(args)
    if (this.executionContext) {
      this.executionContext.lastAffectedTaskId = task.id
      this.executionContext.addTaskCallsThisRequest += 1
    }
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
    const { task, clarification } = await this.resolveTaskIdentifier(args.taskIdentifier, 'marking as done')
    if (!task && clarification) return clarification

    const updated = await this.taskService.markTaskDone({
      ...args,
      taskIdentifier: task!.id,
    })
    this.executionContext && (this.executionContext.lastAffectedTaskId = updated.id)
    return ResponseBuilder.response(TASK_MESSAGES.taskMarkedCompleted(updated.title))
  }

  async handleDeleteTask(args: DeleteTaskCommand): Promise<Response> {
    log('executing deleteTask', { args })
    const { task, clarification } = await this.resolveTaskIdentifier(args.taskIdentifier, 'deleting')
    if (!task && clarification) return clarification

    this.executionContext && (this.executionContext.lastAffectedTaskId = task!.id)
    const deleted = await this.taskService.deleteTask({
      ...args,
      taskIdentifier: task!.id,
    })
    if (deleted) {
      return ResponseBuilder.response(TASK_MESSAGES.taskDeleted)
    }
    throw new Error('Failed to delete task')
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
    const { task, clarification } = await this.resolveTaskIdentifier(args.taskIdentifier, 'renaming')
    if (!task && clarification) return clarification

    const renamed = await this.taskService.renameTask({
      ...args,
      taskIdentifier: task!.id,
    })
    this.executionContext && (this.executionContext.lastAffectedTaskId = renamed.id)
    return ResponseBuilder.response(TASK_MESSAGES.taskRenamed(renamed.title))
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
    const { task, clarification } = await this.resolveTaskIdentifier(args.taskIdentifier, 'updating')
    if (!task && clarification) return clarification

    const updatedTask = await this.taskService.updateTask({
      ...args,
      taskIdentifier: task!.id,
    })
    this.executionContext && (this.executionContext.lastAffectedTaskId = updatedTask.id)
    const updates: string[] = []
    if (args.priority) updates.push(`priority to ${args.priority}`)
    if (args.dueDate !== undefined) updates.push('due date')
    if (args.description !== undefined) updates.push('description')
    const message = `Successfully updated task "${updatedTask.title}"${
      updates.length > 0 ? `: ${updates.join(', ')}` : ''
    }.`
    return ResponseBuilder.response(message)
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
