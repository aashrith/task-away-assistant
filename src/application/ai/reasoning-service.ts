import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'

import type { CoreMessage, ReasoningContext, ReasoningResult, ToolDefinition } from './types'
import { clarificationHints, intentOutputSchema, REASONING_SYSTEM } from './intent'
import { requiredFieldsPerIntent, toolSchemasByName } from './tool-schemas'
import { AI_MESSAGES, DEFAULT_AI_MODEL, FIRST_ERROR_INDEX, LOG_TRUNCATION_LENGTH } from './ai-config'
import { createModuleLogger } from '../../infrastructure/logger'

const log = createModuleLogger('reasoning')

/**
 * Reasoning layer: step-based intent detection, validation, and clarification.
 * Single model call for intent + params, then Zod validation. No chain-of-thought.
 */
export async function reason(
  messages: CoreMessage[],
  _tools: ToolDefinition[],
  context: ReasoningContext
): Promise<ReasoningResult> {
  const lastUser = messages.filter((m) => m.role === 'user').pop()?.content ?? ''
  log('input', {
    lastUser:
      lastUser.slice(0, LOG_TRUNCATION_LENGTH) +
      (lastUser.length > LOG_TRUNCATION_LENGTH ? '...' : ''),
  })
  if (!lastUser.trim()) {
    return { type: 'response', message: AI_MESSAGES.emptyUserMessage }
  }

  const nowIso = context.now.toISOString()
  const { output: object } = await generateText({
    model: openai(process.env.AI_MODEL || DEFAULT_AI_MODEL),
    output: Output.object({ schema: intentOutputSchema }),
    system: `${REASONING_SYSTEM} Current time: ${nowIso}.`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const intent = object.intent
  const raw: Record<string, unknown> = {
    ...(object.title && { title: object.title }),
    ...(object.description && { description: object.description }),
    ...(object.priority && { priority: object.priority }),
    ...(object.dueDate && { dueDate: object.dueDate }),
    ...(object.taskIdentifier && { taskIdentifier: object.taskIdentifier }),
    ...(object.timeframe && { timeframe: object.timeframe }),
    ...(object.newTitle && { newTitle: object.newTitle }),
    ...(object.limit && { limit: object.limit }),
  }
  log('intent', { intent, raw })

  if (intent === 'other') {
    return {
      type: 'response',
      message: AI_MESSAGES.unknownIntent,
    }
  }

  const required = requiredFieldsPerIntent[intent] ?? []
  const missing = required.filter((f) => !(raw as Record<string, unknown>)[f])
  if (missing.length > 0) {
    log('clarification: missing fields', { missing })
    const ask = missing
      .map((m) => clarificationHints[m] ?? `Please provide ${m}.`)
      .join(' ')
    return { type: 'clarification', message: ask }
  }

  const schema = toolSchemasByName[intent]
  if (!schema) {
    return {
      type: 'response',
      message: AI_MESSAGES.noMatch,
    }
  }

  // Transform limit from string to number for listTopPriorities
  if (intent === 'listTopPriorities' && raw.limit) {
    const limitNum = Number(raw.limit)
    // Only set if it's a valid positive integer
    if (Number.isFinite(limitNum) && Number.isInteger(limitNum) && limitNum > 0 && limitNum <= 100) {
      raw.limit = limitNum
    } else {
      // Remove invalid limit - will use default
      delete raw.limit
    }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[FIRST_ERROR_INDEX]
    log('validation failed', { intent, issue: first?.message })
    return {
      type: 'clarification',
      message: first?.message ?? AI_MESSAGES.validationError,
    }
  }

  log('tool_call', { name: intent, args: parsed.data })
  return {
    type: 'tool_call',
    toolCall: { name: intent, args: parsed.data },
  }
}
