import type { ChatRequest } from '../../application/ai/types'
import { createModuleLogger } from '../logger'
import { HTTP_STATUS } from './http-constants'

const log = createModuleLogger('validator')

type HttpError = Error & {
  statusCode: number
  statusMessage?: string
  data?: unknown
}

function badRequest(message: string, data: unknown): HttpError {
  const error = new Error(message) as HttpError
  error.statusCode = HTTP_STATUS.BAD_REQUEST
  error.statusMessage = message
  error.data = data
  return error
}

export type ValidatedMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Validates and sanitizes chat request body.
 */
export async function validateChatRequest(body: unknown): Promise<ValidatedMessage[]> {
  if (!body || typeof body !== 'object') {
    log('invalid request: invalid or missing body')
    throw badRequest('Invalid request: request body is required', {
      error: 'Invalid request: request body is required',
      code: 'INVALID_REQUEST',
    })
  }

  const request = body as Partial<ChatRequest>

  if (!request.messages || !Array.isArray(request.messages)) {
    log('invalid request: messages array missing')
    throw badRequest('Invalid request: messages array is required', {
      error: 'Invalid request: messages array is required',
      code: 'INVALID_REQUEST',
    })
  }

  // Filter out null/undefined messages and validate structure
  const validMessages: ValidatedMessage[] = request.messages
    .filter((m) => {
      return m !== null && m !== undefined && typeof m === 'object' && 'content' in m
    })
    .map((m: any) => {
      const role = m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'user'
      return {
        role: role as 'user' | 'assistant' | 'system',
        content: String(m.content || ''),
      }
    })

  return validMessages
}
