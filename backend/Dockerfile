FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

# Install curl for healthcheck (backend-to-backend check)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV UV_COMPILE_BYTECODE=1

COPY backend/ ./backend/

WORKDIR /app/backend
RUN uv sync --no-dev

EXPOSE 8000

# Entrypoint script to wait for DB and run migrations
COPY <<EOF /app/backend/entrypoint.sh
#!/bin/sh
set -e

echo "Waiting for database at \$DB_HOST:\$DB_PORT..."

# Use a simple python script for a reliable TCP port check
uv run python3 -c "
import socket
import time
import os

host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', 5432))

while True:
    try:
        with socket.create_connection((host, port), timeout=1):
            print(f'Database at {host}:{port} is reachable')
            break
    except (socket.timeout, ConnectionRefusedError, OSError):
        print(f'Waiting for database at {host}:{port}...')
        time.sleep(1)
"

echo "Running migrations..."
uv run alembic upgrade head

echo "Starting backend..."
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
EOF

RUN chmod +x /app/backend/entrypoint.sh

CMD ["./entrypoint.sh"]
