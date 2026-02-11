import { defineEventHandler } from 'h3'

import { TasksHandler } from './handlers/tasks-handler'
import { taskService } from '../task-context'

/**
 * Tasks API endpoint handler.
 *
 * GET /api/tasks
 *
 * Uses class-based TasksHandler for better type safety and maintainability.
 * Returns a list of all tasks.
 */
const tasksHandler = new TasksHandler({ taskService })

export default defineEventHandler(tasksHandler.createHandler())
