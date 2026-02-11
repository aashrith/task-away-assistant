import React from 'react'
import type { UIMessage } from 'ai'
import { MessageResponse } from '@/components/ai-elements/message'

/** Minimal shape for a text part from AI SDK message parts. */
type TextPart = { type: 'text'; text?: string }

/** Minimal shape for a tool-invocation part (AI SDK may use 'tool-invocation' or 'tool-{name}'). */
type ToolPart = {
  type: string
  toolName?: string
  state?: string
  result?: unknown
  output?: unknown
}

function isToolPart(part: { type?: string }): boolean {
  return part.type === 'tool-invocation' || (part.type?.startsWith?.('tool-') ?? false)
}

/** Returns true if the message has at least one renderable part (text or tool). */
export function hasMessageContent(message: UIMessage): boolean {
  const parts = message.parts
  if (parts?.length) {
    const hasText = parts.some((p: unknown) => (p as { type?: string }).type === 'text' && String((p as { text?: string }).text ?? '').trim().length > 0)
    const hasTool = parts.some((p: unknown) => isToolPart(p as { type?: string }))
    return hasText || hasTool
  }
  const content = 'content' in message && typeof (message as { content?: string }).content === 'string'
    ? String((message as { content: string }).content).trim()
    : ''
  return content.length > 0
}

function formatToolLabel(part: ToolPart): string {
  const name =
    part.type === 'tool-invocation'
      ? part.toolName
      : part.type?.replace?.(/^tool-/, '') ?? ''
  if (!name) return 'Tool'
  const spaced = name.replace(/([A-Z])/g, ' $1').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function getToolOutput(part: ToolPart): string | null {
  const done = part.state === 'result' || part.state === 'output-available'
  if (!done) return null
  const raw = part.result ?? part.output
  if (raw === undefined) return null
  return typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
}

type MessageContentNodesProps = { message: UIMessage }

/**
 * Renders the content of a single chat message (text parts + tool invocations).
 * Used by ChatPanel to keep message rendering logic typed and testable.
 */
export function MessageContentNodes({ message }: MessageContentNodesProps): React.JSX.Element | null {
  const parts = message.parts
  const fallbackContent =
    'content' in message && typeof (message as { content?: string }).content === 'string'
      ? String((message as { content: string }).content).trim()
      : ''

  const nodes: React.ReactNode[] = []

  if (parts && parts.length > 0) {
    parts.forEach((part: unknown, index: number) => {
      const p = part as TextPart & ToolPart
      if (p.type === 'text') {
        const text = p.text ?? ''
        if (text.trim().length > 0) {
          nodes.push(<MessageResponse key={index}>{text}</MessageResponse>)
        }
      } else if (isToolPart(p)) {
        const toolPart = p as ToolPart
        const label = formatToolLabel(toolPart)
        const output = getToolOutput(toolPart)
        const isComplete = toolPart.state === 'result' || toolPart.state === 'output-available'
        nodes.push(
          <div key={index} className="chat-tool-invocation">
            <span className="chat-tool-invocation__label">
              {isComplete ? '✓' : '⟳'} {label}
            </span>
            {output != null && (
              <div className="chat-tool-invocation__result">
                <MessageResponse>{output}</MessageResponse>
              </div>
            )}
            {!isComplete && output == null && (
              <span className="chat-tool-invocation__calling">Running tool...</span>
            )}
          </div>
        )
      }
    })
  } else if (fallbackContent) {
    nodes.push(<MessageResponse key="content">{fallbackContent}</MessageResponse>)
  }

  const hasToolInvocations =
    parts?.some((p: unknown) => isToolPart(p as { type?: string })) ?? false
  if (nodes.length === 0 && !hasToolInvocations) return null

  return <>{nodes}</>
}
