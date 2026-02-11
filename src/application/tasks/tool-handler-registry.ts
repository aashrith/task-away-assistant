import type { ToolHandlers } from './tool-handlers'
import type {
  AddTaskCommand,
  MarkTaskDoneCommand,
  DeleteTaskCommand,
  ListOverdueTasksQuery,
  RenameTaskCommand,
  ListTopPrioritiesQuery,
} from '../../domain/task/task-commands'
import { AI_MESSAGES } from '../ai/ai-config'
import { ResponseBuilder } from '../../infrastructure/http/response-builder'

/**
 * Registry mapping tool names to their handlers.
 * Centralizes tool routing logic.
 */
export class ToolHandlerRegistry {
  constructor(private readonly handlers: ToolHandlers) {}

  async execute(toolName: string, args: unknown): Promise<Response> {
    switch (toolName) {
      case 'addTask':
        return this.handlers.handleAddTask(args as AddTaskCommand)

      case 'listTasks':
        return this.handlers.handleListTasks()

      case 'markTaskDone':
        return this.handlers.handleMarkTaskDone(args as MarkTaskDoneCommand)

      case 'deleteTask':
        return this.handlers.handleDeleteTask(args as DeleteTaskCommand)

      case 'listOverdueTasks':
        return this.handlers.handleListOverdueTasks(args as ListOverdueTasksQuery)

      case 'renameTask':
        return this.handlers.handleRenameTask(args as RenameTaskCommand)

      case 'listTopPriorities':
        return this.handlers.handleListTopPriorities(args as ListTopPrioritiesQuery)

      default:
        return ResponseBuilder.response(AI_MESSAGES.actionNotImplemented(toolName))
    }
  }
}
