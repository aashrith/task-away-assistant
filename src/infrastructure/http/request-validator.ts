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

/**
 * Validates and sanitizes HTTP requests.
 * Class-based implementation for better type safety and testability.
 */
export class RequestValidator {
  private static createBadRequestError(message: string, data: unknown): HttpError {
    const error = new Error(message) as HttpError
    error.statusCode = HTTP_STATUS.BAD_REQUEST
    error.statusMessage = message
    error.data = data
    return error
  }

  /**
   * Validates and sanitizes chat request body.
   * @param body - The request body to validate
   * @returns Validated messages array
   * @throws HttpError if validation fails
   */
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

    // Filter out null/undefined messages and validate structure
    const validMessages: ValidatedMessage[] = request.messages
      .filter((m): m is NonNullable<typeof m> => {
        return m !== null && m !== undefined && typeof m === 'object' && 'content' in m
      })
      .map((m): ValidatedMessage => {
        const role = m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'user'
        return {
          role: role as 'user' | 'assistant' | 'system',
          content: String(m.content || ''),
        }
      })

    return validMessages
  }
}

// Export the function for backward compatibility
export const validateChatRequest = RequestValidator.validateChatRequest
