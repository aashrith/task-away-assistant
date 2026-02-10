import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

import type { TaskService } from '../tasks/addTaskFromInput'
import type { AddTaskCommand } from '../tasks/addTaskFromInput'

/**
 * Single place for AI-related server concerns:
 * - model + prompt configuration
 * - chat request/response types
 * - Zod schemas for tools
 * - ChatService class that orchestrates everything
 */

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ChatError {
  error: string
  code?: string
}

const envModel = process.env.AI_MODEL || 'gpt-4o-mini'

const envToolChoice =
  process.env.AI_TOOL_CHOICE === 'none' ||
  process.env.AI_TOOL_CHOICE === 'required' ||
  process.env.AI_TOOL_CHOICE === 'auto'
    ? process.env.AI_TOOL_CHOICE
    : 'auto'

const envTemperature = Number.isFinite(Number(process.env.AI_TEMPERATURE))
  ? Number(process.env.AI_TEMPERATURE)
  : 0.7

const defaultSystemPrompt = `You are a helpful task management assistant. Your job is to help users manage their tasks through natural conversation.

When a user asks you to create a task, use the addTask tool with the information they provide. Extract:
- Task title (required)
- Description (if mentioned)
- Priority: "low", "medium", or "high" (default to "medium" if not specified)
- Due date: parse relative dates like "tomorrow", "Friday", "next week" into ISO-8601 format

Always confirm when you've created a task, and be conversational and helpful.`

export const aiConfig = {
  systemPrompt: process.env.AI_SYSTEM_PROMPT || defaultSystemPrompt,
  model: envModel,
  toolChoice: envToolChoice,
  temperature: envTemperature,
} as const

/**
 * Zod schema for the addTask tool.
 */
export const addTaskParameters = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  /**
   * Optional due date as ISO-8601 string.
   * The AI should parse relative dates ("tomorrow", "Friday") into ISO format.
   */
  dueDate: z.string().optional(),
})

export type AddTaskInput = z.infer<typeof addTaskParameters>

export class ChatService {
  constructor(private readonly taskService: TaskService) {}

  async handle(request: ChatRequest): Promise<Response> {
    const messages = [
      { role: 'system' as const, content: aiConfig.systemPrompt },
      ...(request.messages ?? []),
    ]

    const result = await streamText({
      model: openai(aiConfig.model),
      messages,
      tools: {
        addTask: {
          description:
            'Create a new task in the task manager. Extract title, description, priority, and due date from the user\'s request.',
          inputSchema: addTaskParameters,
          execute: async (input: AddTaskCommand) => {
            const stored = await this.taskService.addFromInput(input)
            return {
              success: true,
              task: stored,
              message: `Task "${stored.title}" created successfully.`,
            }
          },
        },
      },
      toolChoice: aiConfig.toolChoice,
      temperature: aiConfig.temperature,
    })

    return result.toTextStreamResponse()
  }
}


