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

IMPORTANT: If the user mentions multiple tasks in one message (e.g., "I have three tasks: task1, task2, and task3" or "add task A, task B, task C"), extract ALL task titles into the "titles" field as a comma-separated string (e.g., "task1, task2, task3"). Also set "title" to the first task for backward compatibility. If only one task is mentioned, leave "titles" as empty string and use "title" normally.

For "markTaskDone" or "deleteTask": extract taskIdentifier from the user's message. This can be a task title (full or partial match) or task ID. Extract the exact text the user mentions (e.g., if they say "Mark 'Buy milk' done", set taskIdentifier to "Buy milk").

For "renameTask": extract taskIdentifier (the task to rename) and newTitle (the new title). Extract the exact text the user mentions for both.

For "listTasks": no parameters needed.

For "listOverdueTasks": optional timeframe parameter. If user doesn't specify timeframe, set timeframe to empty string.

For "listTopPriorities": extract limit (number like "3" for top 3) and optional timeframe ("today", "this week"). If user says "top 3 priorities today", set limit to "3" and timeframe to "today". If limit not specified, set limit to empty string. If timeframe not specified, set timeframe to empty string.

For bulk operations:
- "deleteAllTasks": when user says "delete all tasks", "clear all", "remove everything", "delete everything", "clear all tasks", "remove all tasks", "wipe all tasks".
- "completeAllTasks": when user says "mark all done", "complete all", "finish all tasks", "mark everything done", "complete everything".
- "clearCompletedTasks": when user says "clear completed", "delete done tasks", "remove finished tasks", "clear all completed".

For "updateTask": when user wants to update properties of a specific task. Extract:
- taskIdentifier: the task title or identifier (required)
- priority: if user mentions changing priority (low, medium, high) - extract as "low", "medium", or "high"
- dueDate: if user mentions changing due date - convert to ISO-8601 format
- description: if user mentions changing description
Examples: "set priority of task X to high", "change task Y priority to low", "update task Z due date to tomorrow", "set due date for task A to Friday", "mark task B as high priority", "change task C to low priority".

For "updateAllTasksPriority": when user wants to change priority for ALL tasks. Extract:
- priority: the priority level to set for all tasks (low, medium, or high) - REQUIRED
Examples: "mark all tasks low priority", "set all tasks to high priority", "change all tasks priority to medium", "make all tasks high priority", "set priority of all tasks to low".

For "help": when user asks "help", "what can you do", "how do I use this", "show commands", "what commands are available", "how to add a task", "how to delete a task", or similar questions asking for assistance or documentation.

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
  help: `Here's what I can help you with:

**Task Management:**
• Add tasks: "add task [title]" or "create task [title]"
  - You can add multiple tasks: "add task1, task2, task3"
  - Set priority: "add high priority task [title]"
  - Set due date: "add task [title] due tomorrow"

• List tasks: "list tasks" or "show my tasks"

• Mark tasks done: "mark [task name] done" or "complete [task name]"

• Delete tasks: "delete [task name]" or "remove [task name]"

• Rename tasks: "rename [task name] to [new name]"

• Update task properties: "set priority of [task] to high", "change [task] priority to low", "update [task] due date to tomorrow"

• Update all tasks priority: "mark all tasks low priority", "set all tasks to high priority"

**Task Queries:**
• Show overdue: "show overdue tasks" or "what's overdue"

• Show top priorities: "show top 3 priorities" or "top priorities this week"

**Bulk Operations:**
• Delete all: "delete all tasks" or "clear all"

• Complete all: "mark all done" or "complete all tasks"

• Clear completed: "clear completed tasks" or "remove finished tasks"

• Update all priority: "mark all tasks [priority]" or "set all tasks to [priority]"

Just ask naturally, and I'll help you manage your tasks!`,
  unknownIntent:
    'I can help you manage tasks. Try: add, list, mark done, delete, rename, show overdue, show top priorities, or bulk operations (delete all, complete all, clear completed). Type "help" for more details.',
  noMatch: "I couldn't match that to a task action. Try: add, list, mark done, delete, rename, show overdue, or type 'help' for all commands.",
  validationError: 'Please provide the missing or valid details.',
  notUnderstood:
    "I didn't understand that. Try asking me to add, list, mark done, delete, rename, or show overdue tasks. Type 'help' for a full list of commands.",
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
