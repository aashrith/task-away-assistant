import type { ChatRequest } from '../../application/ai/types'
import { createModuleLogger } from '../logger'
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from './http-constants'

const log = createModuleLogger('validator')

export interface HttpError extends Error {
  statusCode: number
  statusMessage?: string
  data?: unknown
}

export interface ValidatedMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ValidationResult {
  messages: ValidatedMessage[]
}

/** Message part from AI SDK UIMessage (text or tool-invocation). */
interface MessagePart {
  type?: string
  text?: string
  result?: unknown
  output?: unknown
}

/** Raw message shape from client (content, text, or parts). */
interface IncomingMessage {
  role?: string
  content?: string
  text?: string
  parts?: MessagePart[]
}

/**
 * Extracts a single string content from one message (content, text, or parts).
 * For assistant messages with only tool parts, returns a short placeholder so the turn is kept.
 */
function extractContent(m: IncomingMessage, role: ValidatedMessage['role']): string {
  if (typeof m.content === 'string') return m.content
  if (typeof m.text === 'string') return m.text
  if (!Array.isArray(m.parts) || m.parts.length === 0) return ''

  const textParts = m.parts
    .filter((p): p is MessagePart & { type: 'text'; text: string } =>
      p != null && typeof p === 'object' && p.type === 'text' && typeof p.text === 'string'
    )
    .map((p) => p.text)
  let content = textParts.join(' ')

  if (content.length === 0 && role === 'assistant') {
    const hasTool = m.parts.some((p) => p && typeof p === 'object' && String(p.type ?? '').startsWith('tool'))
    if (hasTool) {
      const toolTexts = m.parts
        .filter((p) => p?.type?.startsWith?.('tool') && (p.result != null || p.output != null))
        .map((p) => String(p!.result ?? p!.output ?? '').trim())
        .filter(Boolean)
      content = toolTexts.length > 0 ? toolTexts.join(' ') : '[Task tool used.]'
    }
  }

  return content
}

/**
 * Validates chat request body: ensures body.messages is an array and normalizes each message to role + content.
 * Supports content, text, or parts (AI SDK) formats. Throws HttpError on invalid input.
 */
export class RequestValidator {
  private static createBadRequestError(message: string, data: unknown): HttpError {
    const err = new Error(message) as HttpError
    err.statusCode = HTTP_STATUS.BAD_REQUEST
    err.statusMessage = message
    err.data = data
    return err
  }

  static validateChatRequest(body: unknown): ValidatedMessage[] {
    if (!body || typeof body !== 'object') {
      log('invalid request: invalid or missing body')
      throw this.createBadRequestError(ERROR_MESSAGES.INVALID_REQUEST_BODY, {
        error: ERROR_MESSAGES.INVALID_REQUEST_BODY,
        code: ERROR_CODES.INVALID_REQUEST,
      })
    }

    const request = body as Partial<ChatRequest>
    if (!request.messages || !Array.isArray(request.messages)) {
      log('invalid request: messages array missing')
      throw this.createBadRequestError(ERROR_MESSAGES.INVALID_MESSAGES_ARRAY, {
        error: ERROR_MESSAGES.INVALID_MESSAGES_ARRAY,
        code: ERROR_CODES.INVALID_REQUEST,
      })
    }

    const rawMessages = request.messages as unknown[]
    const validMessages: ValidatedMessage[] = rawMessages
      .filter((m): m is IncomingMessage => {
        if (!m || typeof m !== 'object') return false
        return 'content' in m || 'text' in m || ('parts' in m && Array.isArray((m as IncomingMessage).parts))
      })
      .map((m): ValidatedMessage => {
        const role: ValidatedMessage['role'] =
          m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'user'
        const content = String(extractContent(m, role)).trim()
        return { role, content }
      })
      .filter((m) => m.content.length > 0)

    log('validation result', { inputCount: request.messages.length, outputCount: validMessages.length })
    return validMessages
  }
}

// Export the function for backward compatibility
export const validateChatRequest = RequestValidator.validateChatRequest
