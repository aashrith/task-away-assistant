import React, { useState, useEffect, useCallback } from 'react'
import { useLoaderData, useRouter } from '@tanstack/react-router'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { TasksPanel } from '@/components/tasks/TasksPanel'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { loadChatMessages, saveChatMessages } from '@/lib/chat-storage'
import type { Task } from '@/domain/task/task'

const CHAT_STORAGE_KEY = 'taskflow-chat-messages'
const TASK_REFRESH_DELAY_MS = 300

export function AppShell(): React.JSX.Element {
  const router = useRouter()
  const loaderData = useLoaderData({ from: '/' })
  const [tasks, setTasks] = useState<Task[]>(loaderData?.tasks ?? [])
  const [taskFilter, setTaskFilter] = useState<'all' | 'overdue' | 'high'>('all')

  const chatTransport = React.useMemo(
    () => new DefaultChatTransport({ api: '/api/chat' }),
    []
  )
  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: chatTransport,
    onFinish: async () => {
      router.invalidate()
      await refreshTasks()
      setTimeout(() => refreshTasks(), TASK_REFRESH_DELAY_MS)
    },
    onError: (err) => {
      console.error('Chat API error:', err)
    },
  })

  useEffect(() => {
    const stored = loadChatMessages(CHAT_STORAGE_KEY)
    if (stored.length > 0 && messages.length === 0) {
      setMessages(stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init only
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      saveChatMessages(CHAT_STORAGE_KEY, messages)
    }
  }, [messages])

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
      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks)
      } else {
        console.warn('Invalid tasks data:', data)
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [])

  useEffect(() => {
    if (loaderData?.tasks && Array.isArray(loaderData.tasks)) {
      setTasks(loaderData.tasks)
    }
  }, [loaderData?.tasks])

  useEffect(() => {
    const handleFocus = () => void refreshTasks()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshTasks])

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

    return tasks.filter((task) => task.priority === 'high')
  }, [tasks, taskFilter])

  const handleSend = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    try {
      await sendMessage({ text: trimmed })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

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
          <ChatPanel 
            messages={messages} 
            onSend={handleSend} 
            isThinking={isThinking}
            error={error}
          />
        </main>
      </div>
    </div>
  )
}
