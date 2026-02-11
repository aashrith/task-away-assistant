import React, { useState, useEffect, useCallback } from 'react'
import { useLoaderData, useRouter } from '@tanstack/react-router'
import { useChat } from '@ai-sdk/react'
import { TasksPanel } from '../tasks/TasksPanel'
import { ChatPanel } from '../chat/ChatPanel'
import type { Task } from '../../domain/task/task'

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

const STORAGE_KEY = 'taskflow-chat-messages'
const TASK_REFRESH_DELAY_MS = 300
const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Welcome. You can add, update or review tasks.',
}

// Load messages from localStorage
function loadMessagesFromStorage(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ChatMessage[]
      // Validate the structure
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load messages from localStorage:', error)
  }
  return []
}

// Save messages to localStorage
function saveMessagesToStorage(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch (error) {
    console.warn('Failed to save messages to localStorage:', error)
  }
}

export function AppShell(): React.JSX.Element {
  const router = useRouter()
  // Get initial tasks from loader (SSR on first load, client-side on navigation)
  const loaderData = useLoaderData({ from: '/' })
  const [tasks, setTasks] = useState<Task[]>(loaderData?.tasks ?? [])
  const [taskFilter, setTaskFilter] = useState<'all' | 'overdue' | 'high'>('all')
  // Use AI SDK's useChat hook for streaming support
  // Defaults to /api/chat endpoint
  const { messages, sendMessage, status } = useChat({
    onFinish: async () => {
      // Refresh tasks after chat completes
      router.invalidate()
      await refreshTasks()
      setTimeout(async () => {
        await refreshTasks()
      }, TASK_REFRESH_DELAY_MS)
    },
  })

  // Convert UIMessage[] to ChatMessage[] for localStorage and ChatPanel
  const chatMessages = React.useMemo(() => {
    return messages.map((msg) => {
      // Extract text content from UIMessage parts
      const textParts = msg.parts
        .filter((part) => part.type === 'text')
        .map((part) => (part as { text: string }).text)
        .join('')
      
      return {
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: textParts || '',
      } as ChatMessage
    })
  }, [messages])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (chatMessages.length > 0) {
      saveMessagesToStorage(chatMessages)
    }
  }, [chatMessages])

  // Refresh tasks function - fetches from API and updates state
  const refreshTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
      if (!response.ok) {
        console.error('Failed to fetch tasks:', response.status)
        return
      }
      const data: { tasks: Task[] } = await response.json()
      console.log('API response:', data)
      if (data.tasks && Array.isArray(data.tasks)) {
        console.log('Refreshed tasks:', data.tasks.length, data.tasks)
        setTasks(data.tasks)
      } else {
        console.warn('Invalid tasks data:', data)
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      // best-effort; ignore for now
    }
  }, [])

  // Sync tasks with loader data when it changes (for SSR/navigation)
  useEffect(() => {
    if (loaderData?.tasks && Array.isArray(loaderData.tasks)) {
      console.log('Syncing tasks from loader:', loaderData.tasks.length)
      setTasks(loaderData.tasks)
    } else {
      console.log('Loader data:', loaderData)
    }
  }, [loaderData?.tasks])

  // Also refresh tasks when router invalidates (after chat operations)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh tasks when window regains focus (user might have multiple tabs)
      void refreshTasks()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshTasks])

  // Load tasks on mount (ensures we have fresh data even if loader didn't run)
  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])

  const visibleTasks = React.useMemo(() => {
    if (taskFilter === 'all') return tasks

    const now = new Date()

    if (taskFilter === 'overdue') {
      return tasks.filter((task) => {
        if (!task.dueDate) return false
        const due = new Date(task.dueDate)
        return due < now && task.status !== 'completed'
      })
    }

    // high priority
    return tasks.filter((task) => task.priority === 'high')
  }, [tasks, taskFilter])

  const handleSend = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    // Use useChat's sendMessage method which handles streaming automatically
    await sendMessage({ text: trimmed })
  }

  // Derive isThinking from status
  const isThinking = status === 'submitted' || status === 'streaming'

  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-shell__header">
          <div className="app-shell__logo-container">
            <img src="/taskflow-logo.svg" alt="Taskflow AI" className="app-shell__logo" />
          </div>
          <div className="app-shell__subtitle">Smart Task Assistant</div>
        </header>

        <main className="app-layout">
          <TasksPanel
            tasks={visibleTasks}
            activeFilter={taskFilter}
            onFilterChange={setTaskFilter}
          />
          <ChatPanel messages={chatMessages} onSend={handleSend} isThinking={isThinking} />
        </main>
      </div>
    </div>
  )
}

