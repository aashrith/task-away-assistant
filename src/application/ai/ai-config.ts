/**
 * AI-specific configuration: prompts, model settings, and AI-related constants.
 */

const DEFAULT_SYSTEM_PROMPT = `You are a helpful task management assistant. Your job is to help users manage their tasks through natural conversation.

When a user asks you to create a task, use the addTask tool with the information they provide. Extract:
- Task title (required)
- Description (if mentioned)
- Priority: "low", "medium", or "high" (default to "medium" if not specified)
- Due date: parse relative dates like "tomorrow", "Friday", "next week" into ISO-8601 format

Always confirm when you've created a task, and be conversational and helpful.`

export const REASONING_SYSTEM = `You are an intent classifier for a task manager. Output only the user's intent and extracted parameters. No explanation. 

For dates use ISO-8601 format.

For "add task": require title only; dueDate and priority are optional. Extract them if the user provides them.

For "markTaskDone" or "deleteTask": extract taskIdentifier from the user's message. This can be a task title (full or partial match) or task ID. Extract the exact text the user mentions (e.g., if they say "Mark 'Buy milk' done", set taskIdentifier to "Buy milk").

For "renameTask": extract taskIdentifier (the task to rename) and newTitle (the new title). Extract the exact text the user mentions for both.

For "listTasks": no parameters needed.

For "listOverdueTasks": optional timeframe parameter. If user doesn't specify timeframe, set timeframe to empty string.

For "listTopPriorities": extract limit (number like "3" for top 3) and optional timeframe ("today", "this week"). If user says "top 3 priorities today", set limit to "3" and timeframe to "today". If limit not specified, set limit to empty string. If timeframe not specified, set timeframe to empty string.

For list/summarize without timeframe set timeframe to empty.`

export const clarificationHints: Record<string, string> = {
  title: 'What is the task title?',
  dueDate: 'When is it due? (e.g. tomorrow, Friday)',
  priority: 'What priority: low, medium, or high?',
  taskIdentifier: 'Which task? (title or id)',
  newTitle: 'What should the new title be?',
  limit: 'How many tasks? (e.g., 3 for top 3)',
}

export const AI_MESSAGES = {
  emptyUserMessage: 'What would you like to do with your tasks?',
  unknownIntent:
    'I can only help with tasks: add, list, mark done, delete, or show overdue. What would you like to do?',
  noMatch: "I couldn't match that to a task action. Try: add, list, mark done, delete, or overdue.",
  validationError: 'Please provide the missing or valid details.',
  notUnderstood:
    "I didn't understand that. Try asking me to add, list, mark done, delete, or show overdue tasks.",
  actionNotImplemented: (actionName: string) => `Action "${actionName}" is not yet implemented.`,
} as const

export const DEFAULT_AI_MODEL = 'gpt-4o-mini'

export const DEFAULT_AI_TEMPERATURE = 0.7

export const LOG_TRUNCATION_LENGTH = 80

export const FIRST_ERROR_INDEX = 0

export const MIN_STRING_LENGTH = 1

export type ToolChoice = 'auto' | 'none' | 'required'

export class AiConfig {
  constructor(
    public readonly systemPrompt: string,
    public readonly model: string,
    public readonly toolChoice: ToolChoice,
    public readonly temperature: number
  ) {}

  static fromEnv(): AiConfig {
    const model = process.env.AI_MODEL ?? 'gpt-5.2'
    const rawToolChoice = process.env.AI_TOOL_CHOICE
    const toolChoice: ToolChoice =
      rawToolChoice === 'none' || rawToolChoice === 'required' || rawToolChoice === 'auto'
        ? rawToolChoice
        : 'auto'
    const temperature = Number.isFinite(Number(process.env.AI_TEMPERATURE))
      ? Number(process.env.AI_TEMPERATURE)
      : DEFAULT_AI_TEMPERATURE
    const systemPrompt = process.env.AI_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT
    return new AiConfig(systemPrompt, model, toolChoice, temperature)
  }
}

/** Default instance for backward compatibility; prefer injecting AiConfig.fromEnv(). */
export const aiConfig = AiConfig.fromEnv()
