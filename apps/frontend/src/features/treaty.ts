import { treaty } from "@elysiajs/eden"
import type { App } from '../../../backend/src/index'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export const eden = treaty<App>(backendUrl)

