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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Elysia version conflict between frontend/backend
export const eden = treaty<App>(getBackendUrl())

