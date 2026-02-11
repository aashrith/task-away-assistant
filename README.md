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

### Directory Structure

```
src/
├── domain/           # Core business logic (no framework dependencies)
│   └── task/
│       ├── task.ts                    # Domain entity
│       ├── task-repository.ts         # Domain interface
│       ├── task-commands.ts           # Commands/queries
│       └── index.ts                   # Barrel export
│
├── application/      # Use cases and orchestration
│   ├── ai/
│   │   ├── ai-config.ts              # AI configuration
│   │   ├── task-config.ts            # Task configuration
│   │   ├── config.ts                 # Barrel export
│   │   ├── intent.ts                 # Intent detection
│   │   ├── reasoning-service.ts      # Reasoning service
│   │   ├── tool-schemas.ts           # Tool schemas
│   │   ├── types.ts                  # Type definitions
│   │   └── index.ts                  # Barrel export
│   └── tasks/
│       ├── task-service.ts           # Main service
│       ├── *-use-case.ts             # Use cases
│       ├── task-finder.ts            # Utilities
│       ├── task-formatter.ts         # Utilities
│       ├── tool-handlers.ts          # Tool handlers
│       ├── tool-handler-registry.ts  # Registry
│       └── index.ts                  # Barrel export
│
├── infrastructure/   # External concerns (persistence, HTTP, logging)
│   ├── http/
│   │   ├── http-constants.ts         # HTTP constants
│   │   ├── request-validator.ts      # Request validation
│   │   ├── response-builder.ts       # Response building
│   │   └── index.ts                  # Barrel export
│   ├── task/
│   │   ├── in-memory-task-repository.ts  # Implementation
│   │   └── index.ts                  # Barrel export
│   └── logger.ts                     # Logging utility
│
├── routes/          # TanStack Router files
│   ├── __root.tsx
│   └── index.tsx
│
├── router.tsx       # Router configuration
└── routeTree.gen.ts # Generated route tree
```

