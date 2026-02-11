import type { EventHandler } from 'h3'
import { readBody, HTTPError } from 'h3'

import type { TaskService } from '../../../src/application/tasks/task-service'
import { streamReasoning } from '../../../src/application/ai/reasoning-service'
import { RequestValidator } from '../../../src/infrastructure/http/request-validator'
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

/**
 * Class-based handler for chat API requests.
 * Uses streaming reasoning service with native tool calling.
 *
 * Responsibilities:
 * - Parse and validate incoming chat requests
 * - Convert messages to CoreMessage format
 * - Delegate to streaming reasoning service
 * - Handle errors and return appropriate HTTP responses
 */
export class ChatHandler {
  constructor(private readonly dependencies: ChatHandlerDependencies) {}

  /**
   * Creates an H3 event handler for chat POST requests.
   * @returns EventHandler function that processes chat requests
   */
  createHandler(): EventHandler {
    return async (event) => {
      try {
        const body = await this.parseRequestBody(event)
        const validMessages = RequestValidator.validateChatRequest(body)
        const coreMessages = this.convertToCoreMessages(validMessages)
        const context = { now: new Date() }

        const response = await streamReasoning(
          coreMessages,
          this.dependencies.taskService,
          context
        )

        log('streaming response')
        return response
      } catch (error) {
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

  /**
   * Converts validated messages to CoreMessage format.
   * @param validMessages - Validated messages from request validator
   * @returns Array of CoreMessage objects
   */
  private convertToCoreMessages(
    validMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return validMessages.map((message) => ({
      role: message.role,
      content: message.content,
    }))
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
