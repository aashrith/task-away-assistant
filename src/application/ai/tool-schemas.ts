import type { z } from 'zod'

import {
  AddTaskCommandSchema,
  ListTasksQuerySchema,
  MarkTaskDoneCommandSchema,
  DeleteTaskCommandSchema,
  ListOverdueTasksQuerySchema,
  RenameTaskCommandSchema,
  ListTopPrioritiesQuerySchema,
  DeleteAllTasksCommandSchema,
  CompleteAllTasksCommandSchema,
  ClearCompletedTasksCommandSchema,
  UpdateTaskCommandSchema,
  UpdateAllTasksPriorityCommandSchema,
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
  RenameTaskCommandSchema as renameTaskArgsSchema,
  ListTopPrioritiesQuerySchema as listTopPrioritiesArgsSchema,
  DeleteAllTasksCommandSchema as deleteAllTasksArgsSchema,
  CompleteAllTasksCommandSchema as completeAllTasksArgsSchema,
  ClearCompletedTasksCommandSchema as clearCompletedTasksArgsSchema,
  UpdateTaskCommandSchema as updateTaskArgsSchema,
  UpdateAllTasksPriorityCommandSchema as updateAllTasksPriorityArgsSchema,
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
  renameTask: RenameTaskCommandSchema,
  listTopPriorities: ListTopPrioritiesQuerySchema,
  deleteAllTasks: DeleteAllTasksCommandSchema,
  completeAllTasks: CompleteAllTasksCommandSchema,
  clearCompletedTasks: ClearCompletedTasksCommandSchema,
  updateTask: UpdateTaskCommandSchema,
  updateAllTasksPriority: UpdateAllTasksPriorityCommandSchema,
}

export const requiredFieldsPerIntent: Record<string, string[]> = {
  addTask: ['title'], // dueDate and priority are optional
  listTasks: [],
  markTaskDone: ['taskIdentifier'],
  deleteTask: ['taskIdentifier'],
  listOverdueTasks: [],
  renameTask: ['taskIdentifier', 'newTitle'],
  listTopPriorities: [],
  deleteAllTasks: [],
  completeAllTasks: [],
  clearCompletedTasks: [],
  updateTask: ['taskIdentifier'], // priority, dueDate, description are optional
  updateAllTasksPriority: ['priority'],
}
