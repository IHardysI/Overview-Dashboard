# Универсальный Dockerfile для frontend и backend
FROM node:20-alpine AS base

# Установка pnpm и bun
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
RUN npm install -g bun

WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY . .

# Сборка frontend
RUN pnpm --filter frontend build

# Сборка backend
RUN bun run --filter backend build

# Продакшен образ
FROM node:20-alpine AS runner

# Установка bun для runtime
RUN npm install -g bun

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создание пользователя
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 appuser

# Копирование собранных приложений
COPY --from=base --chown=appuser:appuser /app/apps/frontend/public ./apps/frontend/public
COPY --from=base --chown=appuser:appuser /app/apps/frontend/.next/standalone ./
COPY --from=base --chown=appuser:appuser /app/apps/frontend/.next/static ./apps/frontend/.next/static

COPY --from=base --chown=appuser:appuser /app/apps/backend/dist ./backend/dist
COPY --from=base --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=base --chown=appuser:appuser /app/apps/backend/package.json ./backend/package.json

# Создание скрипта запуска
RUN echo '#!/bin/sh\n\
echo "Starting backend..."\n\
bun run backend/dist/index.js &\n\
BACKEND_PID=$!\n\
echo "Starting frontend..."\n\
node apps/frontend/server.js &\n\
FRONTEND_PID=$!\n\
wait $BACKEND_PID $FRONTEND_PID' > /app/start.sh && chmod +x /app/start.sh

USER appuser

EXPOSE 3000 3001

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"] 