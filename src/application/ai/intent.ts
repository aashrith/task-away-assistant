import { z } from 'zod'
import { REASONING_SYSTEM, clarificationHints } from './ai-config'

/**
 * Intent detection: schema and prompts for the reasoning step.
 * Keeps reasoning prompts and intent shape in one place.
 */

/**
 * All fields are required in the schema so the generated JSON schema
 * satisfies OpenAI strict response_format (every key in properties must be in required).
 * Use empty string for "not provided"; reasoning layer treats falsy values as absent.
 */
export const intentOutputSchema = z.object({
  intent: z
    .enum([
      'addTask',
      'listTasks',
      'markTaskDone',
      'deleteTask',
      'listOverdueTasks',
      'renameTask',
      'listTopPriorities',
      'other',
    ])
    .describe(
      'The detected user intent: addTask, listTasks, markTaskDone, deleteTask, listOverdueTasks, renameTask, listTopPriorities, or other'
    ),
  title: z
    .string()
    .describe('Task title extracted from user message (empty string if not applicable or not provided)'),
  description: z
    .string()
    .describe('Task description extracted from user message (empty string if not provided)'),
  priority: z
    .string()
    .describe('Task priority: "low", "medium", or "high" (empty string if not provided)'),
  dueDate: z
    .string()
    .describe('Due date in ISO-8601 format (empty string if not provided)'),
  taskIdentifier: z
    .string()
    .describe('Task identifier (title or ID) for markTaskDone/deleteTask operations (empty string if not applicable)'),
  timeframe: z
    .string()
    .describe('Timeframe filter for listOverdueTasks/listTopPriorities (e.g., "today", "this week") (empty string if not provided)'),
  newTitle: z
    .string()
    .describe('New title for renameTask operation (empty string if not applicable)'),
  limit: z
    .string()
    .describe('Limit for listTopPriorities (e.g., "3" for top 3) (empty string if not provided)'),
})

// Re-export for convenience
export { REASONING_SYSTEM, clarificationHints }
