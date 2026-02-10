# Task Away Assistant

AI-powered chat-based task manager built on TanStack Start. 

## Stack

- **Runtime**: TanStack Start (React, Vite, Nitro)
- **Language**: TypeScript end-to-end
- **UI**: AI Elements + custom CSS (no Tailwind)
- **AI**: Vercel AI SDK (streaming + tool calling)
- **Data**: SQLite in dev behind a repository abstraction

## Development

```bash
npm install
npm run dev
```

- App runs on the default Vite dev server port (see `package.json`).
- Routing is file-based via `src/routes`.

## Architecture

- **domain**: core models and interfaces (no framework code)
- **application**: use cases and orchestration
- **infrastructure**: persistence, HTTP clients, adapters
- **ui**: reusable view components
- **routes**: TanStack route files that compose UI + application layer
- **styles**: global and shared CSS

