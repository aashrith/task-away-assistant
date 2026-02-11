import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

import type { TaskService } from '../tasks/addTaskFromInput'
import type { AddTaskCommand } from '../../domain/task/task-commands'
import type { ChatRequest } from './types'
import { aiConfig } from './config'
import { addTaskParameters } from './tool-schemas'

/**
 * Chat service: orchestrates streaming chat with tool execution.
 * Depends on application config and task use-case only.
 */
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
