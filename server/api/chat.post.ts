import { defineEventHandler, readBody, createError } from 'h3'

import { InMemoryTaskRepository } from '../../src/infrastructure/task/InMemoryTaskRepository'
import {
  ChatService,
  type ChatRequest,
  type ChatError,
} from '../../src/application/ai/chatServer'
import { TaskService } from '../../src/application/tasks/addTaskFromInput'

const taskRepo = new InMemoryTaskRepository()
const taskService = new TaskService(taskRepo)
const chatService = new ChatService(taskService)

export default defineEventHandler(async (event): Promise<Response | ChatError> => {
  try {
    const body = await readBody<ChatRequest>(event)

    if (!body?.messages || !Array.isArray(body.messages)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: messages array is required',
        data: {
          error: 'Invalid request: messages array is required',
          code: 'INVALID_REQUEST',
        },
      })
    }

    return chatService.handle(body)
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    })
  }
})

