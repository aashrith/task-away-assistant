import { createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

const DEFAULT_PRELOAD_STALE_TIME = 0

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},

    scrollRestoration: true,
    defaultPreloadStaleTime: DEFAULT_PRELOAD_STALE_TIME,
  })

  return router
}
