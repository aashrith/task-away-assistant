/**
 * Centralized logging utility with normalized format.
 * Format: [timestamp] [identifier] message [data]
 */

type LogLevel = 'info' | 'debug' | 'warn' | 'error'

interface LogOptions {
  identifier: string
  level?: LogLevel
  data?: object
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function createLogger(identifier: string) {
  return (message: string, data?: object) => {
    if (!process.env.DEBUG && !process.env.NODE_ENV?.includes('dev')) {
      return
    }

    const timestamp = formatTimestamp()
    const logData = data ? ` ${JSON.stringify(data)}` : ''
    const prefix = `[${timestamp}] [${identifier}]`

    console.log(`${prefix} ${message}${logData}`)
  }
}

/**
 * Create a logger instance for a specific module/component.
 * @param identifier - Module or component identifier (e.g., 'chat', 'reasoning', 'repository')
 */
export function createModuleLogger(identifier: string) {
  return createLogger(identifier)
}

/**
 * Log with explicit identifier (for one-off logs).
 */
export function log(options: LogOptions & { message: string }) {
  if (!process.env.DEBUG && !process.env.NODE_ENV?.includes('dev')) {
    return
  }

  const timestamp = formatTimestamp()
  const level = options.level || 'info'
  const logData = options.data ? ` ${JSON.stringify(options.data)}` : ''
  const prefix = `[${timestamp}] [${options.identifier}] [${level.toUpperCase()}]`

  console.log(`${prefix} ${options.message}${logData}`)
}
