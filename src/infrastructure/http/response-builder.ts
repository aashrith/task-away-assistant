import { HTTP_STATUS } from './http-constants'

export interface SuccessResponseData {
  type: string
  message: string
}

export interface StreamResponseOptions {
  chunkDelayMs?: number
}

/**
 * Builds standardized HTTP responses for the chat API.
 * Class-based implementation with proper TypeScript types.
 */
export class ResponseBuilder {
  /**
   * Creates a success JSON response.
   * @param data - Response data with type and message
   * @returns HTTP Response with JSON body
   */
  static success(data: SuccessResponseData): Response {
    return new Response(JSON.stringify(data), {
      status: HTTP_STATUS.OK,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  /**
   * Creates a clarification response.
   * @param message - Clarification message
   * @returns HTTP Response with JSON body
   */
  static clarification(message: string): Response {
    return this.success({ type: 'clarification', message })
  }

  /**
   * Creates a standard response.
   * @param message - Response message
   * @returns HTTP Response with JSON body
   */
  static response(message: string): Response {
    return this.success({ type: 'response', message })
  }

  /**
   * Streams a text response using AI SDK's data stream format.
   * This provides a better UX with progressive text rendering.
   * Compatible with useChat hook from @ai-sdk/react.
   * 
   * Formats the message according to AI SDK's data stream protocol:
   * - Text chunks: 0:"text"\n
   * - Finish: d:{"type":"finish"}\n
   * 
   * @param message - The message to stream
   * @param options - Optional streaming configuration
   * @returns HTTP Response with streaming body
   */
  static streamResponse(message: string, options: StreamResponseOptions = {}): Response {
    const { chunkDelayMs = 30 } = options
    const encoder = new TextEncoder()
    
    // Create a readable stream that emits the message in AI SDK's data stream format
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Split message into words for smoother streaming effect
          const words = message.split(' ')
          
          for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i]
            
            // Format as AI SDK data stream chunk: 0:"text chunk"\n
            // Escape quotes and newlines in the chunk
            const escapedChunk = chunk
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
            
            const data = `0:"${escapedChunk}"\n`
            controller.enqueue(encoder.encode(data))
            
            // Small delay between chunks for streaming effect
            await new Promise(resolve => setTimeout(resolve, chunkDelayMs))
          }
          
          // Send finish event: d:{"type":"finish"}\n
          controller.enqueue(encoder.encode('d:{"type":"finish"}\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }
}
