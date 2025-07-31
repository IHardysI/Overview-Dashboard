# Универсальный Dockerfile для frontend и backend
FROM node:20-alpine AS base

# Установка pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Установка bun через curl
RUN apk add --no-cache curl unzip bash
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

# Копирование файлов зависимостей
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/

# Установка зависимостей
RUN pnpm install --no-frozen-lockfile

# Копирование исходного кода
COPY . .

# Сборка frontend
RUN pnpm --filter frontend build

# Сборка backend
RUN cd apps/backend && bun run build

# Продакшен образ
FROM node:20-alpine AS runner

# Создание пользователя
RUN addgroup --system --gid 1001 appuser
RUN adduser --system --uid 1001 appuser

# Установка bun для runtime в глобальную директорию
RUN apk add --no-cache curl unzip bash
RUN curl -fsSL https://bun.sh/install | bash
RUN mv /root/.bun /usr/local/bun
ENV PATH="/usr/local/bun/bin:$PATH"

# Копирование собранных приложений
COPY --from=base --chown=appuser:appuser /app/apps/frontend/public ./apps/frontend/public
COPY --from=base --chown=appuser:appuser /app/apps/frontend/.next/standalone ./
COPY --from=base --chown=appuser:appuser /app/apps/frontend/.next/static ./apps/frontend/.next/static

COPY --from=base --chown=appuser:appuser /app/apps/backend/dist ./backend/dist
COPY --from=base --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=base --chown=appuser:appuser /app/apps/backend/package.json ./backend/package.json

# Исправление прав доступа к bun
RUN chown -R appuser:appuser /usr/local/bun

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Копирование собранных приложений
COPY --from=base --chown=appuser:appuser /app/apps/frontend/public ./apps/frontend/public
COPY --from=base --chown=appuser:appuser /app/apps/frontend/.next/standalone ./
COPY --from=base --chown=appuser:appuser /app/apps/frontend/.next/static ./apps/frontend/.next/static

COPY --from=base --chown=appuser:appuser /app/apps/backend/dist ./backend/dist
COPY --from=base --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=base --chown=appuser:appuser /app/apps/backend/package.json ./backend/package.json

# Создание скрипта запуска
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting backend..."' >> /app/start.sh && \
    echo 'bun run backend/dist/index.js &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "Starting frontend..."' >> /app/start.sh && \
    echo 'node apps/frontend/server.js &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'wait $BACKEND_PID $FRONTEND_PID' >> /app/start.sh && \
    chmod +x /app/start.sh && chown appuser:appuser /app/start.sh

EXPOSE 3000 3001

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER appuser

ENTRYPOINT []
CMD ["/app/start.sh"] 