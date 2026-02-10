import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <h1>Task Away Assistant</h1>
      <p>
        This will become an AI-powered task manager with streaming chat and
        tool-calling. For now, it&apos;s a minimal shell so we can build the
        domain and infrastructure step by step.
      </p>
    </main>
  )
}
