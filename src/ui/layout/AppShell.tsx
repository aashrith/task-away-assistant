import React, { useState, useEffect, useCallback } from 'react'
import { useLoaderData, useRouter } from '@tanstack/react-router'
import { TasksPanel } from '../tasks/TasksPanel'
import { ChatPanel } from '../chat/ChatPanel'
import type { Task } from '../../domain/task/task'

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

const STORAGE_KEY = 'taskflow-chat-messages'
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
  
  // Initialize messages from localStorage or use default welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadMessagesFromStorage()
    return saved.length > 0 ? saved : [DEFAULT_WELCOME_MESSAGE]
  })
  
  const [isThinking, setIsThinking] = useState(false)

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages)
    }
  }, [messages])

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

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)

    try {
      setIsThinking(true)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data: { type: string; message: string } = await response.json()
      setMessages((current) => [...current, { role: 'assistant', content: data.message }])
      
      // Invalidate router first to trigger loader refresh
      router.invalidate()
      
      // Refresh tasks immediately and then again after a short delay to ensure we catch updates
      // This handles cases where the server needs a moment to persist changes
      await refreshTasks()
      
      // Also refresh after a brief delay to catch any delayed server updates
      setTimeout(async () => {
        await refreshTasks()
      }, 300)
    } catch (error) {
      const fallback =
        error instanceof Error ? error.message : 'Unexpected error talking to assistant.'
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `Sorry, I ran into a problem: ${fallback}`,
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

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
          <ChatPanel messages={messages} onSend={handleSend} isThinking={isThinking} />
        </main>
      </div>
    </div>
  )
}

