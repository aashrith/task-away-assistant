import { z } from 'zod'

/**
 * Domain command/query shapes for task operations.
 * Zod schemas define valid inputs; use these for validation at boundaries.
 */

const prioritySchema = z.enum(['low', 'medium', 'high'])

export const AddTaskCommandSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().optional(),
})

export const ListTasksQuerySchema = z.object({})

export const MarkTaskDoneCommandSchema = z.object({
  taskIdentifier: z.string().min(1, 'Task title or id is required'),
})

export const DeleteTaskCommandSchema = z.object({
  taskIdentifier: z.string().min(1, 'Task title or id is required'),
})

export const ListOverdueTasksQuerySchema = z.object({
  timeframe: z.string().optional(),
})

export type AddTaskCommand = z.infer<typeof AddTaskCommandSchema>
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>
export type MarkTaskDoneCommand = z.infer<typeof MarkTaskDoneCommandSchema>
export type DeleteTaskCommand = z.infer<typeof DeleteTaskCommandSchema>
export type ListOverdueTasksQuery = z.infer<typeof ListOverdueTasksQuerySchema>
