import type { z } from 'zod'

/**
 * Shared types for the AI application layer.
 * Keeps contracts explicit for chat, reasoning, and adapters.
 */

/** Message shape for chat and reasoning (compatible with SDK). */
export type CoreMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** Tool definition for the reasoning layer. */
export type ToolDefinition = { name: string; parameters: z.ZodTypeAny }

/** Result of the reasoning step: clarify, call a tool, or plain response. */
export type ReasoningResult =
  | { type: 'clarification'; message: string }
  | { type: 'tool_call'; toolCall: { name: string; args: unknown } }
  | { type: 'response'; message: string }

/** Context passed into reasoning (e.g. current time). */
export type ReasoningContext = { now: Date }

/** Request body for POST /api/chat. */
export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

/** Error payload for chat API. */
export interface ChatError {
  error: string
  code?: string
}
