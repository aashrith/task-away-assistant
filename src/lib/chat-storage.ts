import type { UIMessage } from 'ai'

const DEFAULT_MESSAGE: UIMessage = {
  id: '',
  role: 'user',
  content: '',
  parts: [{ type: 'text', text: '' }],
}

function toUIMessage(raw: unknown): UIMessage {
  if (raw && typeof raw === 'object' && 'role' in raw && 'content' in raw) {
    const msg = raw as Record<string, unknown>
    if (msg.parts && Array.isArray(msg.parts)) {
      return msg as UIMessage
    }
    const role = msg.role === 'system' ? 'assistant' : (msg.role as UIMessage['role'])
    const content = typeof msg.content === 'string' ? msg.content : ''
    return {
      id: typeof msg.id === 'string' ? msg.id : `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      parts: [{ type: 'text', text: content }],
    } as UIMessage
  }
  return { ...DEFAULT_MESSAGE, id: `msg-${Date.now()}-${Math.random()}` }
}

/**
 * Load chat messages from localStorage. Returns empty array if missing or invalid.
 */
export function loadChatMessages(storageKey: string): UIMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    return parsed.map(toUIMessage)
  } catch {
    return []
  }
}

/**
 * Persist chat messages to localStorage. No-op on server or on failure.
 */
export function saveChatMessages(storageKey: string, messages: UIMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(messages))
  } catch {
    // Ignore quota or serialization errors
  }
}
