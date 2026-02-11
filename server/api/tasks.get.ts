import { defineEventHandler } from 'h3'
import { taskService } from '../task-context'

export default defineEventHandler(async () => {
  const tasks = await taskService.listTasks({})
  return { tasks }
})

