FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV UV_COMPILE_BYTECODE=1

COPY backend/ ./backend/

WORKDIR /app/backend 
RUN sed -i 's/\r$//' entrypoint.sh
RUN uv sync --no-dev
RUN chmod +x entrypoint.sh

EXPOSE 8000


ENTRYPOINT ["./entrypoint.sh"]