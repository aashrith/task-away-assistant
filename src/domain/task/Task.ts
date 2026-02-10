export type TaskId = string

export type TaskSource = 'user' | 'assistant'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived'

export type TaskPriority = 'low' | 'medium' | 'high'

/**
 * Core task entity for the system.
 *
 * Note: Dates are ISO-8601 strings so they can move easily
 * across the wire (API, DB, client) without extra mapping.
 */
export interface Task {
  id: TaskId
  title: string
  description?: string

  status: TaskStatus
  priority: TaskPriority

  /**
   * Optional due date in ISO-8601 format (e.g. 2025-01-31T23:59:59.000Z)
   */
  dueDate?: string

  createdAt: string
  updatedAt: string

  source: TaskSource
}

