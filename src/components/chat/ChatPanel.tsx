import React from 'react'
import type { UIMessage } from 'ai'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input'
import { MessageContentNodes, hasMessageContent } from '@/components/chat/MessageContentNodes'

type ChatPanelProps = {
  messages: UIMessage[]
  onSend: (content: string) => void | Promise<void>
  isThinking?: boolean
  error?: Error | null
}

export function ChatPanel({
  messages,
  onSend,
  isThinking = false,
  error,
}: ChatPanelProps): React.JSX.Element {
  return (
    <section
      aria-label="Chat control interface"
      className="app-layout__column app-layout__column--chat"
    >
      <header className="panel-header">Chat</header>
      <div className="chat-body">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => {
              if (!hasMessageContent(message)) return null
              const role = message.role === 'system' ? 'assistant' : message.role
              return (
                <Message key={message.id} from={role}>
                  <MessageContent>
                    <MessageContentNodes message={message} />
                  </MessageContent>
                </Message>
              )
            })}

            {isThinking && (
              <Message from="assistant">
                <MessageContent>
                  <span className="chat-typing__dots" aria-label="Assistant is typing">
                    <span />
                    <span />
                    <span />
                  </span>
                </MessageContent>
              </Message>
            )}

            {error && (
              <Message from="assistant">
                <MessageContent>
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                    Error: {error.message || 'Failed to send message. Please try again.'}
                  </div>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
        </Conversation>

        <PromptInput
          onSubmit={async ({ text }) => {
            if (text?.trim()) {
              await onSend(text.trim())
            }
          }}
        >
          <PromptInputTextarea
            placeholder="Type a message..."
            disabled={isThinking}
          />
          <PromptInputSubmit
            status={isThinking ? 'streaming' : 'ready'}
          />
        </PromptInput>
      </div>
    </section>
  )
}
