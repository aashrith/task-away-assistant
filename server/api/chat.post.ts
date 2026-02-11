import { defineEventHandler, readBody } from 'h3'

import { InMemoryTaskRepository } from '../../src/infrastructure/task/in-memory-task-repository'
import { reason, type ChatError } from '../../src/application/ai'
import { TaskService } from '../../src/application/tasks/task-service'
import { AI_MESSAGES } from '../../src/application/ai/ai-config'
import { HTTP_STATUS } from '../../src/infrastructure/http/http-constants'
import { createModuleLogger } from '../../src/infrastructure/logger'
import { validateChatRequest } from '../../src/infrastructure/http/request-validator'
import { ResponseBuilder } from '../../src/infrastructure/http/response-builder'
import { ToolHandlers } from '../../src/application/tasks/tool-handlers'
import { ToolHandlerRegistry } from '../../src/application/tasks/tool-handler-registry'
import { createError } from 'h3'

const taskRepo = new InMemoryTaskRepository()
const taskService = new TaskService(taskRepo)
const toolHandlers = new ToolHandlers(taskService)
const toolRegistry = new ToolHandlerRegistry(toolHandlers)

const log = createModuleLogger('chat')

/**
 * Chat API endpoint handler.
 * Orchestrates request validation, reasoning, and tool execution.
 */
export default defineEventHandler(async (event): Promise<Response | ChatError> => {
  try {
    const body = await readBody(event).catch(() => null)
    const validMessages = await validateChatRequest(body)

    log('request', { messageCount: validMessages.length })

    if (validMessages.length === 0) {
      return ResponseBuilder.response(AI_MESSAGES.emptyUserMessage)
    }

    const result = await reason(validMessages, [], { now: new Date() })
    log('reason result', {
      type: result.type,
      ...(result.type === 'tool_call' && { tool: result.toolCall.name }),
    })

    // Handle clarification and direct responses
    if (result.type === 'clarification' || result.type === 'response') {
      return ResponseBuilder.success({ type: result.type, message: result.message })
    }

    // Handle tool calls
    if (result.type === 'tool_call') {
      return await toolRegistry.execute(result.toolCall.name, result.toolCall.args)
    }

    // Fallback for unknown result types
    return ResponseBuilder.response(AI_MESSAGES.notUnderstood)
  } catch (error) {
    // If it's already an h3 error, re-throw it to preserve status code
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    log('error', { message: error instanceof Error ? error.message : String(error) })
    throw createError({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      statusMessage: 'Internal server error',
      data: {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    })
  }
})
