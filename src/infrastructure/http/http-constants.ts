/**
 * HTTP-related constants: status codes and HTTP utilities.
 */

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Error codes for API error responses.
 */
export const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_JSON: 'INVALID_JSON',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

/**
 * Error messages for API error responses.
 */
export const ERROR_MESSAGES = {
  INVALID_JSON: 'Invalid JSON format in request body',
  INVALID_REQUEST_BODY: 'Invalid request: request body is required',
  INVALID_MESSAGES_ARRAY: 'Invalid request: messages array is required',
  INTERNAL_ERROR: 'Internal server error',
} as const
