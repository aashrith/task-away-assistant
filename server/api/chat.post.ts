import { defineEventHandler, readBody } from 'h3'

import { reason, type ChatError } from '../../src/application/ai'
import { AI_MESSAGES } from '../../src/application/ai/ai-config'
import { HTTP_STATUS } from '../../src/infrastructure/http/http-constants'
import { createModuleLogger } from '../../src/infrastructure/logger'
import { validateChatRequest } from '../../src/infrastructure/http/request-validator'
import { ResponseBuilder } from '../../src/infrastructure/http/response-builder'
import { ToolHandlers } from '../../src/application/tasks/tool-handlers'
import { ToolHandlerRegistry } from '../../src/application/tasks/tool-handler-registry'
import { createError } from 'h3'
import { taskService } from '../task-context'

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
      ...(result.type === 'tool_calls' && { toolCount: result.toolCalls.length }),
    })

    // Handle clarification and direct responses
    if (result.type === 'clarification' || result.type === 'response') {
      return ResponseBuilder.success({ type: result.type, message: result.message })
    }

    // Handle multiple tool calls (e.g., multiple tasks)
    if (result.type === 'tool_calls') {
      // Extract task titles from args before execution
      const taskTitles: string[] = []
      for (const toolCall of result.toolCalls) {
        if (toolCall.name === 'addTask' && typeof toolCall.args === 'object' && toolCall.args !== null) {
          const args = toolCall.args as { title?: string }
          if (args.title) {
            taskTitles.push(args.title)
          }
        }
      }
      
      // Execute all tool calls
      await Promise.all(
        result.toolCalls.map((toolCall) => toolRegistry.execute(toolCall.name, toolCall.args))
      )
      
      // Return combined response
      if (taskTitles.length > 0) {
        const message = taskTitles.length === 1
          ? `Task "${taskTitles[0]}" created successfully.`
          : `✓ Created ${taskTitles.length} tasks:\n${taskTitles.map((title, i) => `  ${i + 1}. "${title}"`).join('\n')}`
        return ResponseBuilder.response(message)
      }
      
      // Fallback: execute first and return
      return await toolRegistry.execute(result.toolCalls[0].name, result.toolCalls[0].args)
    }

    // Handle single tool call
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
