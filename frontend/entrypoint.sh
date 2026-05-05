#!/bin/sh
set -e

# Wait for backend to be ready
echo "Waiting for backend at ${NUXT_API_BACKEND_BASE}/health..."
MAX_RETRIES=30
COUNT=0

until curl -s "${NUXT_API_BACKEND_BASE}/health" | grep -q "ok"; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -gt $MAX_RETRIES ]; then
    echo "Backend timed out after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "Backend is unavailable (attempt $COUNT/$MAX_RETRIES) - sleeping"
  sleep 3
done

echo "Backend is up - starting build and prerendering"

# Build the application
# This will run prerendering while the backend is accessible via the network
npm run build

# Start the application
echo "Starting application..."
node .output/server/index.mjs
