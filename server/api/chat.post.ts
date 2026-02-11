import { defineEventHandler } from 'h3'

import { ChatHandler } from './handlers/chat-handler'
import { taskService } from '../task-context'

/**
 * Chat API endpoint handler.
 *
 * POST /api/chat
 *
 * Uses class-based ChatHandler with streaming reasoning and tool calling.
 * Handles chat requests and streams AI responses with tool execution.
 */
const chatHandler = new ChatHandler({ taskService })

export default defineEventHandler(chatHandler.createHandler())
