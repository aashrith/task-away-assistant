import React, { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Simple markdown renderer for chat messages.
 * Handles: bold (**text**), italic (*text*), code (`code`), and line breaks.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let key = 0

  // Split by lines first to handle line breaks
  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${key++}`} />)
    }

    if (!line.trim()) {
      return
    }

    // Process inline markdown: **bold**, *italic*, `code`
    const tokens: React.ReactNode[] = []
    let pos = 0

    while (pos < line.length) {
      // Check for bold **text** (must check before italic)
      const boldMatch = line.slice(pos).match(/^\*\*([^*]+)\*\*/)
      if (boldMatch) {
        tokens.push(
          <strong key={key++}>
            {boldMatch[1]}
          </strong>
        )
        pos += boldMatch[0].length
        continue
      }

      // Check for code `text` (before italic to avoid conflicts)
      const codeMatch = line.slice(pos).match(/^`([^`]+)`/)
      if (codeMatch) {
        tokens.push(
          <code key={key++} className="chat-markdown-code">
            {codeMatch[1]}
          </code>
        )
        pos += codeMatch[0].length
        continue
      }

      // Check for italic *text* (single asterisk, not double)
      const italicMatch = line.slice(pos).match(/^\*([^*`\n]+)\*/)
      if (italicMatch && line[pos + italicMatch[0].length] !== '*') {
        tokens.push(
          <em key={key++}>
            {italicMatch[1]}
          </em>
        )
        pos += italicMatch[0].length
        continue
      }

      // Regular text - find the next markdown token
      let nextPos = line.length
      const nextBold = line.indexOf('**', pos)
      const nextCode = line.indexOf('`', pos)
      const nextItalic = line.indexOf('*', pos)

      if (nextBold !== -1 && nextBold < nextPos) nextPos = nextBold
      if (nextCode !== -1 && nextCode < nextPos) nextPos = nextCode
      if (nextItalic !== -1 && nextItalic < nextPos && line[nextItalic + 1] !== '*') {
        nextPos = nextItalic
      }

      if (nextPos < line.length) {
        tokens.push(
          <span key={key++}>
            {line.slice(pos, nextPos)}
          </span>
        )
        pos = nextPos
      } else {
        tokens.push(
          <span key={key++}>
            {line.slice(pos)}
          </span>
        )
        break
      }
    }

    if (tokens.length > 0) {
      parts.push(...tokens)
    } else if (line.length > 0) {
      parts.push(
        <span key={key++}>
          {line}
        </span>
      )
    }
  })

  return parts.length > 0
    ? parts
    : [
        <span key={0}>
          {text}
        </span>,
      ]
}

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

type ChatPanelProps = {
  messages: ChatMessage[]
  onSend: (content: string) => void | Promise<void>
  isThinking?: boolean
}

const DEBOUNCE_DELAY_MS = 500 // Minimum time between submissions
const SCROLL_TO_BOTTOM_DELAY_MS = 100
const ENTER_KEY_CODE = 13

export function ChatPanel({
  messages,
  onSend,
  isThinking = false,
}: ChatPanelProps): React.JSX.Element {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastSubmitTimeRef = useRef<number>(0)
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    const value = input.trim()
    
    // Prevent submission if empty, already submitting, or thinking
    if (!value || isSubmitting || isThinking) return
    
    // Debounce: prevent rapid submissions
    const now = Date.now()
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current
    if (timeSinceLastSubmit < DEBOUNCE_DELAY_MS) {
      return
    }
    
    lastSubmitTimeRef.current = now
    setIsSubmitting(true)
    
    try {
      await onSend(value)
      setInput('')
    } finally {
      // Small delay before allowing next submission
      setTimeout(() => {
        setIsSubmitting(false)
      }, DEBOUNCE_DELAY_MS)
    }
  }, [input, isSubmitting, isThinking, onSend])

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Ensure input is not readOnly when user focuses
    event.target.removeAttribute('readonly')
  }

  // Auto-scroll to bottom when new messages are added or when thinking
  useEffect(() => {
    if (chatHistoryRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (chatHistoryRef.current) {
          chatHistoryRef.current.scrollTo({
            top: chatHistoryRef.current.scrollHeight,
            behavior: 'smooth',
          })
        }
      }, SCROLL_TO_BOTTOM_DELAY_MS)
    }
  }, [messages.length, isThinking])

  return (
    <section
      aria-label="Chat control interface"
      className="app-layout__column app-layout__column--chat"
    >
      <header className="panel-header">Chat</header>
      <div className="chat-body">
        <div ref={chatHistoryRef} className="chat-history" aria-live="polite">
          {messages.map((message, index) => {
            const isAssistant = message.role === 'assistant'
            const alignmentClass = isAssistant
              ? 'chat-message--assistant'
              : 'chat-message--user'
            const bubbleClass = isAssistant
              ? 'chat-bubble chat-bubble--assistant'
              : 'chat-bubble chat-bubble--user'
            const label = isAssistant ? 'Assistant' : 'You'

            return (
              <div key={index} className={`chat-message ${alignmentClass}`}>
                <div className={bubbleClass}>
                  <span className="chat-bubble__label">{label}</span>
                  <span className="chat-bubble__content">
                    {isAssistant ? renderMarkdown(message.content) : message.content.split('\n').map((line, i) =>
                      i === 0 ? (
                        line
                      ) : (
                        <React.Fragment key={i}>
                          <br />
                          {line}
                        </React.Fragment>
                      )
                    )}
                  </span>
                </div>
              </div>
            )
          })}

          {isThinking && (
            <div className="chat-message chat-message--assistant" aria-live="polite">
              <div className="chat-bubble chat-bubble--assistant chat-typing">
                <span className="chat-bubble__label">Assistant</span>
                <span className="chat-typing__dots" aria-label="Assistant is typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          )}
        </div>

        <form
          className="chat-input-row"
          aria-label="Chat input"
          onSubmit={handleSubmit}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
        >
          {/* Hidden fake input to trick browsers into autofilling this instead */}
          <input
            type="text"
            autoComplete="off"
            style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
            tabIndex={-1}
            aria-hidden="true"
            readOnly
          />
          <label className="sr-only" htmlFor="chat-input">
            Type a message
          </label>
          <input
            id="chat-input"
            className="chat-input"
            type="text"
            placeholder="Type a message..."
            aria-label="Type a message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onFocus={handleInputFocus}
            autoComplete="off"
            name="x-chat-input"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore="true"
            role="textbox"
            spellCheck="false"
            readOnly={isSubmitting || isThinking}
            disabled={isSubmitting || isThinking}
            onMouseDown={(e) => {
              // Remove readOnly on mouse down (before focus) to allow immediate typing
              if (!isSubmitting && !isThinking) {
                e.currentTarget.removeAttribute('readonly')
              }
            }}
            onKeyDown={(e) => {
              // Prevent Enter key from submitting if already submitting
              if ((e.key === 'Enter' || e.keyCode === ENTER_KEY_CODE) && (isSubmitting || isThinking)) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          />
          <button
            type="submit"
            className="chat-send-button"
            aria-label="Send message"
            disabled={isSubmitting || isThinking || !input.trim()}
          >
            ➤
          </button>
        </form>
      </div>
    </section>
  )
}

