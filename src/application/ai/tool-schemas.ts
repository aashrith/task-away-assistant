import type { z } from 'zod'

import {
  AddTaskCommandSchema,
  ListTasksQuerySchema,
  MarkTaskDoneCommandSchema,
  DeleteTaskCommandSchema,
  ListOverdueTasksQuerySchema,
} from '../../domain/task/task-commands'

/**
 * Application wiring: map intent names to domain command/query schemas.
 * Validation stays in domain; this layer only references it.
 */

export {
  AddTaskCommandSchema as addTaskArgsSchema,
  ListTasksQuerySchema as listTasksArgsSchema,
  MarkTaskDoneCommandSchema as markTaskDoneArgsSchema,
  DeleteTaskCommandSchema as deleteTaskArgsSchema,
  ListOverdueTasksQuerySchema as listOverdueTasksArgsSchema,
}

/** Alias for chat/streaming tool. */
export const addTaskParameters = AddTaskCommandSchema
export type AddTaskInput = import('../../domain/task/task-commands').AddTaskCommand

export const toolSchemasByName: Record<string, z.ZodTypeAny> = {
  addTask: AddTaskCommandSchema,
  listTasks: ListTasksQuerySchema,
  markTaskDone: MarkTaskDoneCommandSchema,
  deleteTask: DeleteTaskCommandSchema,
  listOverdueTasks: ListOverdueTasksQuerySchema,
}

export const requiredFieldsPerIntent: Record<string, string[]> = {
  addTask: ['title', 'dueDate', 'priority'],
  listTasks: [],
  markTaskDone: ['taskIdentifier'],
  deleteTask: ['taskIdentifier'],
  listOverdueTasks: [],
}
