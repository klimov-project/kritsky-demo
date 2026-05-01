# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Arguments for build time
ARG NUXT_API_BACKEND_BASE
ARG NUXT_PUBLIC_API_BASE

ENV NUXT_API_BACKEND_BASE=${NUXT_API_BACKEND_BASE}
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy output from builder
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
