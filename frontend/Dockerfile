FROM node:22-alpine

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application source
COPY . .

# Ensure entrypoint is executable
RUN chmod +x entrypoint.sh

# Environment variables (can be overridden at runtime)
ENV NUXT_API_BACKEND_BASE=http://backend:8000
ENV NUXT_PUBLIC_API_BASE=/api
ENV NODE_ENV=production

EXPOSE 3000

# Use entrypoint to build and start at runtime
ENTRYPOINT ["./entrypoint.sh"]
