import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { z } from 'zod'

import type { CoreMessage, ReasoningContext } from './types'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_AI_MODEL, LOG_TRUNCATION_LENGTH } from './ai-config'
import { toolSchemasByName } from './tool-schemas'
import { createModuleLogger } from '../../infrastructure/logger'
import type { TaskService } from '../tasks/task-service'
import { ToolHandlers } from '../tasks/tool-handlers'
import { ToolHandlerRegistry } from '../tasks/tool-handler-registry'

const log = createModuleLogger('reasoning')

/**
 * Streaming reasoning service with native tool calling.
 * Uses streamText with tools for real-time streaming responses.
 * Tool execution happens during streaming, and the AI responds conversationally.
 */
export async function streamReasoning(
  messages: CoreMessage[],
  taskService: TaskService,
  context: ReasoningContext
): Promise<Response> {
  const lastUser = messages.filter((m) => m.role === 'user').pop()?.content ?? ''
  log('input', {
    lastUser:
      lastUser.slice(0, LOG_TRUNCATION_LENGTH) +
      (lastUser.length > LOG_TRUNCATION_LENGTH ? '...' : ''),
  })

  if (!lastUser.trim()) {
    // Return empty message response as stream
    const { ResponseBuilder } = await import('../../infrastructure/http/response-builder')
    const { AI_MESSAGES } = await import('./ai-config')
    return ResponseBuilder.streamResponse(AI_MESSAGES.emptyUserMessage)
  }

  // Set up tool handlers
  const toolHandlers = new ToolHandlers(taskService)
  const toolRegistry = new ToolHandlerRegistry(toolHandlers)

  // Convert tool schemas to AI SDK tool definitions
  // Use zodSchema() helper to ensure proper Zod v4 to JSON Schema conversion
  const toolsRecord: Record<string, any> = {}
  
  for (const [name, schema] of Object.entries(toolSchemasByName)) {
    // Pass Zod schema directly to tool() - it handles conversion internally
    // The tool() function expects inputSchema, not parameters
    const zodSchemaInstance = schema as z.ZodTypeAny
    
    // Create tool - tool() will automatically convert Zod schema to JSON Schema
    toolsRecord[name] = tool({
      description: `Tool for ${name} operation. Use this when the user wants to ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
      inputSchema: zodSchemaInstance,
      execute: async (args: any) => {
        const response = await toolRegistry.execute(name, args)
        const responseData = await response.json()
        return responseData.message || 'Operation completed'
      },
    })
  }

  const nowIso = context.now.toISOString()
  const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}

Current time: ${nowIso}.

When executing tools, provide conversational responses to the user. Be helpful and confirm actions clearly.`

  // Stream text with tool calling
  const streamOptions: any = {
    model: openai(process.env.AI_MODEL || DEFAULT_AI_MODEL),
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    tools: toolsRecord,
  }
  const result = streamText(streamOptions)

  // Return streaming response in AI SDK data stream format
  return result.toTextStreamResponse()
}

/**
 * Legacy reason function for backward compatibility.
 * Now delegates to streaming version but returns ReasoningResult.
 * @deprecated Use streamReasoning for new code
 */
export async function reason(
  _messages: CoreMessage[],
  _tools: unknown[],
  _context: ReasoningContext
): Promise<import('./types').ReasoningResult> {
  // This is kept for backward compatibility but should not be used
  // The chat handler should use streamReasoning directly
  throw new Error('reason() is deprecated. Use streamReasoning() for streaming with tool calling.')
}
