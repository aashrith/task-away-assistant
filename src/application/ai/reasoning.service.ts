import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'

import type { CoreMessage, ReasoningContext, ReasoningResult, ToolDefinition } from './types'
import { clarificationHints, intentOutputSchema, REASONING_SYSTEM } from './intent'
import { requiredFieldsPerIntent, toolSchemasByName } from './tool-schemas'

const log = (msg: string, data?: object) => {
  if (process.env.DEBUG) console.log(`[reasoning] ${msg}`, data ?? '')
}

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
  log('input', { lastUser: lastUser.slice(0, 80) + (lastUser.length > 80 ? '...' : '') })
  if (!lastUser.trim()) {
    return { type: 'response', message: 'What would you like to do with your tasks?' }
  }

  const nowIso = context.now.toISOString()
  const { output: object } = await generateText({
    model: openai(process.env.AI_MODEL || 'gpt-4o-mini'),
    output: Output.object({ schema: intentOutputSchema }),
    system: `${REASONING_SYSTEM} Current time: ${nowIso}.`,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const intent = object.intent
  const raw = {
    ...(object.title && { title: object.title }),
    ...(object.description && { description: object.description }),
    ...(object.priority && { priority: object.priority }),
    ...(object.dueDate && { dueDate: object.dueDate }),
    ...(object.taskIdentifier && { taskIdentifier: object.taskIdentifier }),
    ...(object.timeframe && { timeframe: object.timeframe }),
  }
  log('intent', { intent, raw })

  if (intent === 'other') {
    return {
      type: 'response',
      message:
        "I can only help with tasks: add, list, mark done, delete, or show overdue. What would you like to do?",
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
      message:
        "I couldn't match that to a task action. Try: add, list, mark done, delete, or overdue.",
    }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    log('validation failed', { intent, issue: first?.message })
    return {
      type: 'clarification',
      message: first?.message ?? 'Please provide the missing or valid details.',
    }
  }

  log('tool_call', { name: intent, args: parsed.data })
  return {
    type: 'tool_call',
    toolCall: { name: intent, args: parsed.data },
  }
}
