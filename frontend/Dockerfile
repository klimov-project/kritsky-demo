ARG NEXT_PUBLIC_API_URL=http://localhost:8000

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN echo "DEBUG: NEXT_PUBLIC_API_URL is [${NEXT_PUBLIC_API_URL}]"
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine AS runner

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copy necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Expose the frontend port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
