import { defineEventHandler, readBody, createError } from 'h3'

import { InMemoryTaskRepository } from '../../src/infrastructure/task/InMemoryTaskRepository'
import { reason, type ChatRequest, type ChatError } from '../../src/application/ai'
import { TaskService } from '../../src/application/tasks/addTaskFromInput'

const taskRepo = new InMemoryTaskRepository()
const taskService = new TaskService(taskRepo)

const log = (msg: string, data?: object) => {
  if (process.env.DEBUG) console.log(`[chat] ${msg}`, data ?? '')
}

export default defineEventHandler(async (event): Promise<Response | ChatError> => {
  try {
    const body = await readBody<ChatRequest>(event)
    log('request', { messageCount: body?.messages?.length ?? 0 })

    if (!body?.messages || !Array.isArray(body.messages)) {
      log('invalid request: messages array missing')
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: messages array is required',
        data: {
          error: 'Invalid request: messages array is required',
          code: 'INVALID_REQUEST',
        },
      })
    }

    const result = await reason(
      body.messages.map((m) => ({ role: m.role, content: m.content })),
      [],
      { now: new Date() }
    )
    log('reason result', { type: result.type, ...(result.type === 'tool_call' && { tool: result.toolCall.name }) })

    if (result.type === 'clarification' || result.type === 'response') {
      return new Response(JSON.stringify({ type: result.type, message: result.message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (result.type === 'tool_call' && result.toolCall.name === 'addTask') {
      log('executing addTask', { args: result.toolCall.args })
      const task = await taskService.addFromInput(
        result.toolCall.args as { title: string; description?: string; priority?: 'low' | 'medium' | 'high'; dueDate?: string }
      )
      return new Response(
        JSON.stringify({
          type: 'response',
          message: `Task "${task.title}" created.`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        type: 'response',
        message: "That action isn't available yet.",
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    log('error', { message: error instanceof Error ? error.message : String(error) })
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
      data: {
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    })
  }
})
