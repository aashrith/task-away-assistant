import { z } from 'zod'

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
  intent: z.enum([
    'addTask',
    'listTasks',
    'markTaskDone',
    'deleteTask',
    'listOverdueTasks',
    'other',
  ]),
  title: z.string(),
  description: z.string(),
  priority: z.string(),
  dueDate: z.string(),
  taskIdentifier: z.string(),
  timeframe: z.string(),
})

export const REASONING_SYSTEM = `You are an intent classifier for a task manager. Output only the user's intent and extracted parameters. No explanation. For dates use ISO-8601. For "add task" require title, dueDate, priority. For list/summarize without timeframe set timeframe to empty.`

export const clarificationHints: Record<string, string> = {
  title: 'What is the task title?',
  dueDate: 'When is it due? (e.g. tomorrow, Friday)',
  priority: 'What priority: low, medium, or high?',
  taskIdentifier: 'Which task? (title or id)',
}
