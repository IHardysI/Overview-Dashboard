import { treaty } from "@elysiajs/eden"
import type { App } from '../../../backend/src/index'

const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  
  if (envUrl.startsWith('/')) {
    return typeof window !== 'undefined' 
      ? `${window.location.origin}${envUrl}`
      : `http://localhost:3000${envUrl}`
  }
  
  return envUrl
}

// @ts-expect-error - Elysia version conflict between frontend/backend
export const eden = treaty<App>(getBackendUrl())

