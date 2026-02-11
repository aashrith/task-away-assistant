import { streamText, tool, createUIMessageStreamResponse } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { z } from 'zod'

import type { CoreMessage, ReasoningContext } from './types'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_AI_MODEL, LOG_TRUNCATION_LENGTH } from './ai-config'
import { toolSchemasByName } from './tool-schemas'
import { createModuleLogger } from '../../infrastructure/logger'
import type { TaskService } from '../tasks/task-service'
import { createTaskExecutionContext } from '../tasks/execution-context'
import { ToolHandlers } from '../tasks/tool-handlers'
import { ToolHandlerRegistry } from '../tasks/tool-handler-registry'

const log = createModuleLogger('reasoning')

/** Max messages to send so the model has multi-turn context without blowing the context window. */
const MAX_CONTEXT_MESSAGES = 50

/**
 * Trims to the last N messages so the model has multi-turn context without exceeding the context window.
 */
function messagesForContext(messages: CoreMessage[]): CoreMessage[] {
  if (messages.length === 0) return messages
  if (messages.length <= MAX_CONTEXT_MESSAGES) return messages
  return messages.slice(-MAX_CONTEXT_MESSAGES)
}

/**
 * Builds the tools record for the AI SDK: one entry per schema, execute delegates to the registry.
 * Typed as Record<string, unknown> to avoid SDK generic mismatch (Tool<unknown> vs Tool<never>).
 */
function buildToolsRecord(
  toolRegistry: ToolHandlerRegistry,
  schemas: Record<string, z.ZodTypeAny>
): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  for (const [name, schema] of Object.entries(schemas)) {
    record[name] = tool({
      description: `Tool for ${name}. Use when the user wants to ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
      inputSchema: schema,
      execute: async (args: unknown) => {
        const response = await toolRegistry.execute(name, args)
        const data = (await response.json()) as { message?: string }
        return data.message ?? 'Operation completed'
      },
    })
  }
  return record
}

/**
 * Streaming reasoning with tool calling. Returns a Response (UI message stream) for useChat.
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
    const { ResponseBuilder } = await import('../../infrastructure/http/response-builder')
    const { AI_MESSAGES } = await import('./ai-config')
    return ResponseBuilder.streamResponse(AI_MESSAGES.emptyUserMessage)
  }

  const executionContext = createTaskExecutionContext()
  const toolHandlers = new ToolHandlers(taskService, executionContext)
  const toolRegistry = new ToolHandlerRegistry(toolHandlers)

  const toolsRecord = buildToolsRecord(toolRegistry, toolSchemasByName)
  const contextMessages = messagesForContext(messages)
  log('context messages', { total: messages.length, sent: contextMessages.length })

  const nowIso = context.now.toISOString()
  const systemPrompt = `${DEFAULT_SYSTEM_PROMPT}

Current time: ${nowIso}.

For this turn: Let's think step by step. (1) If the message is only a greeting (hello, hi, hey)—reply in text only; do not call any tool. (2) Otherwise: analyze task intent, use history for "that"/"it", then decide: tool, clarification, or direct reply. (3) Act. (4) After any tool run, use the observation to reply.`

  const model = openai(process.env.AI_MODEL ?? DEFAULT_AI_MODEL)
  const result = streamText({
    model,
    system: systemPrompt,
    messages: contextMessages.map((m) => ({ role: m.role, content: m.content })),
    tools: toolsRecord as Parameters<typeof streamText>[0]['tools'],
  })

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  })
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
