# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Arguments for build time
ARG NUXT_API_BACKEND_BASE
ARG NUXT_PUBLIC_API_BASE

ENV NUXT_API_BACKEND_BASE=${NUXT_API_BACKEND_BASE}
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}

COPY package*.json ./
RUN npm install

COPY . .

# Отладка: проверяем переменные
RUN echo "Building with NUXT_API_BACKEND_BASE: ${NUXT_API_BACKEND_BASE}"
RUN echo "Building with NUXT_PUBLIC_API_BASE: ${NUXT_PUBLIC_API_BASE}"

# Сборка
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]