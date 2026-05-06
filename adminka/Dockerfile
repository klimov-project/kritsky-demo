FROM node:22-alpine AS builder

WORKDIR /app



# Важно: NEXT_PUBLIC_* переменные ДОЛЖНЫ быть доступны при сборке
ARG NEXT_PUBLIC_BASE_PATH=/adminka
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SUPPORT_EMAIL=${NEXT_PUBLIC_SUPPORT_EMAIL}

COPY package*.json ./
RUN npm ci --only=production || npm i --verbose

COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NEXT_PUBLIC_BASE_PATH=/adminka

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["npm", "start"]