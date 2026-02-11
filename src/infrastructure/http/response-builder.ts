import { HTTP_STATUS } from './http-constants'

/**
 * Builds standardized HTTP responses for the chat API.
 */
export class ResponseBuilder {
  static success(data: { type: string; message: string }): Response {
    return new Response(JSON.stringify(data), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  static clarification(message: string): Response {
    return this.success({ type: 'clarification', message })
  }

  static response(message: string): Response {
    return this.success({ type: 'response', message })
  }
}
