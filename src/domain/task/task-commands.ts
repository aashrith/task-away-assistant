import { z } from 'zod'
import { MIN_STRING_LENGTH } from '../../application/ai/ai-config'

/**
 * Domain command/query shapes for task operations.
 * Zod schemas define valid inputs; use these for validation at boundaries.
 */

const prioritySchema = z
  .enum(['low', 'medium', 'high'])
  .describe('Task priority level: low, medium, or high')

export const AddTaskCommandSchema = z.object({
  title: z
    .string()
    .min(MIN_STRING_LENGTH, 'Task title is required')
    .describe('The title or name of the task'),
  description: z.string().optional().describe('Optional detailed description of the task'),
  priority: prioritySchema.optional().describe('Optional priority level (defaults to medium if not specified)'),
  dueDate: z
    .string()
    .optional()
    .describe('Optional due date in ISO-8601 format (e.g., 2024-12-31T23:59:59Z)'),
})

export const ListTasksQuerySchema = z.object({}).describe('Query parameters for listing all tasks (currently no filters)')

export const MarkTaskDoneCommandSchema = z.object({
  taskIdentifier: z
    .string()
    .min(MIN_STRING_LENGTH, 'Task title or id is required')
    .describe('The task identifier: either the full task title, partial title match, or task ID'),
})

export const DeleteTaskCommandSchema = z.object({
  taskIdentifier: z
    .string()
    .min(MIN_STRING_LENGTH, 'Task title or id is required')
    .describe('The task identifier: either the full task title, partial title match, or task ID'),
})

export const ListOverdueTasksQuerySchema = z.object({
  timeframe: z
    .string()
    .optional()
    .describe('Optional timeframe filter for overdue tasks (e.g., "today", "this week", "this month")'),
})

export const RenameTaskCommandSchema = z.object({
  taskIdentifier: z
    .string()
    .min(MIN_STRING_LENGTH, 'Task title or id is required')
    .describe('The task identifier: either the full task title, partial title match, or task ID'),
  newTitle: z
    .string()
    .min(MIN_STRING_LENGTH, 'New task title is required')
    .describe('The new title for the task'),
})

export const ListTopPrioritiesQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum number of tasks to return (defaults to 3)'),
  timeframe: z
    .string()
    .optional()
    .describe('Optional timeframe filter (e.g., "today", "this week") - defaults to "today"'),
})

export type AddTaskCommand = z.infer<typeof AddTaskCommandSchema>
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>
export type MarkTaskDoneCommand = z.infer<typeof MarkTaskDoneCommandSchema>
export type DeleteTaskCommand = z.infer<typeof DeleteTaskCommandSchema>
export type ListOverdueTasksQuery = z.infer<typeof ListOverdueTasksQuerySchema>
export type RenameTaskCommand = z.infer<typeof RenameTaskCommandSchema>
export type ListTopPrioritiesQuery = z.infer<typeof ListTopPrioritiesQuerySchema>
