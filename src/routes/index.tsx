import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '../components/layout/AppShell'
import { taskService } from '../../server/task-context'

export const Route = createFileRoute('/')({
  // Loader runs on server for SSR and on client for navigation
  loader: async () => {
    const tasks = await taskService.listTasks({})
    return { tasks }
  },
  component: AppShell,
})
