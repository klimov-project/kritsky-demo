#!/bin/sh
set -e

echo "Waiting for database at $DB_HOST:$DB_PORT..."

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