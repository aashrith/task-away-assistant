/**
 * Request-scoped context for tool execution.
 * Tracks the last task affected and add-task call count for guardrails.
 */
export interface TaskExecutionContext {
  lastAffectedTaskId?: string
  /** Number of addTask calls in this request (for per-message limit). */
  addTaskCallsThisRequest: number
}

export function createTaskExecutionContext(): TaskExecutionContext {
  return { addTaskCallsThisRequest: 0 }
}
