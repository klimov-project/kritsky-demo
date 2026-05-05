FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV UV_COMPILE_BYTECODE=1

COPY backend/ ./backend/

WORKDIR /app/backend
RUN uv sync --no-dev

EXPOSE 8000

COPY backend/entrypoint.sh /app/backend/entrypoint.sh
RUN chmod +x /app/backend/entrypoint.sh

CMD ["./entrypoint.sh"]