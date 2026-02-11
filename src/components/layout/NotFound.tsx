import type React from 'react'

export function NotFound(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Not found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </main>
  )
}
