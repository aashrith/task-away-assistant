import type { EventHandler } from 'h3'
import { readBody, HTTPError, getMethod } from 'h3'

import type { TaskService } from '../../../src/application/tasks/task-service'
import { streamReasoning } from '../../../src/application/ai/reasoning-service'
import { RequestValidator } from '../../../src/infrastructure/http/request-validator'
import type { ValidatedMessage } from '../../../src/infrastructure/http/request-validator'
import {
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
} from '../../../src/infrastructure/http/http-constants'
import { createModuleLogger } from '../../../src/infrastructure/logger'

const log = createModuleLogger('chat-handler')

export interface ChatHandlerDependencies {
  taskService: TaskService
}

/** Request body shape expected from the chat client. */
interface ChatRequestBody {
  messages?: unknown[]
}

/**
 * Handles POST /api/chat: validates body, runs streaming reasoning, returns stream response.
 * Errors are mapped to HTTP responses; H3 propagates thrown HTTPError.
 */
export class ChatHandler {
  constructor(private readonly dependencies: ChatHandlerDependencies) {}

  createHandler(): EventHandler {
    return async (event) => {
      try {
        const method = getMethod(event)
        log('request', { method, path: event.path })

        const body = await this.parseRequestBody(event) as ChatRequestBody | null
        const messageCount = Array.isArray(body?.messages) ? body.messages.length : 0
        log('body parsed', { messageCount })

        const validMessages = RequestValidator.validateChatRequest(body)
        const coreMessages = this.convertToCoreMessages(validMessages)
        const context = { now: new Date() }

        const response = await streamReasoning(
          coreMessages,
          this.dependencies.taskService,
          context
        )

        log('streaming started', { status: response.status })
        return response
      } catch (error) {
        log('handler error', { error: error instanceof Error ? error.message : String(error) })
        return this.handleError(error)
      }
    }
  }

  /**
   * Parses the request body, handling JSON parsing errors.
   * @param event - H3 event object
   * @returns Parsed request body or null if body is missing
   * @throws HTTPError if JSON parsing fails
   */
  private async parseRequestBody(event: Parameters<EventHandler>[0]): Promise<unknown> {
    try {
      return await readBody(event)
    } catch (error) {
      if (this.isJsonParseError(error)) {
        throw new HTTPError({
          status: HTTP_STATUS.BAD_REQUEST,
          statusText: ERROR_MESSAGES.INVALID_JSON,
          message: ERROR_MESSAGES.INVALID_JSON,
          data: { code: ERROR_CODES.INVALID_JSON },
        })
      }
      return null
    }
  }

  private convertToCoreMessages(validMessages: ValidatedMessage[]): ValidatedMessage[] {
    return validMessages.map((m) => ({ role: m.role, content: m.content }))
  }

  /**
   * Handles errors and converts them to appropriate HTTP responses.
   * @param error - The error to handle
   * @throws HTTPError with appropriate status and message
   */
  private handleError(error: unknown): never {
    if (this.isH3Error(error)) {
      throw error
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    log('error', { error: errorMessage })

    throw new HTTPError({
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      statusText: ERROR_MESSAGES.INTERNAL_ERROR,
      message: errorMessage,
      data: { code: ERROR_CODES.INTERNAL_ERROR },
    })
  }

  /**
   * Type guard to check if an error is an H3 HTTPError.
   * @param error - The error to check
   * @returns True if error is an HTTPError instance
   */
  private isH3Error(error: unknown): error is HTTPError {
    return error instanceof HTTPError
  }

  /**
   * Type guard to check if an error is a JSON parsing error.
   * @param error - The error to check
   * @returns True if error is a JSON parsing error
   */
  private isJsonParseError(error: unknown): boolean {
    return (
      error instanceof SyntaxError ||
      (error !== null &&
        typeof error === 'object' &&
        'message' in error &&
        String(error.message).includes('JSON'))
    )
  }
}
