import React, { useState, useRef, useCallback } from 'react'

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

export function ChatPanel({
  messages,
  onSend,
  isThinking = false,
}: ChatPanelProps): React.JSX.Element {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastSubmitTimeRef = useRef<number>(0)

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

  return (
    <section
      aria-label="Chat control interface"
      className="app-layout__column app-layout__column--chat"
    >
      <header className="panel-header">Chat</header>
      <div className="chat-body">
        <div className="chat-history" aria-live="polite">
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
                    {message.content.split('\n').map((line, i) =>
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
              if ((e.key === 'Enter' || e.keyCode === 13) && (isSubmitting || isThinking)) {
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

