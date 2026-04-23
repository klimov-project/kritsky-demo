## Env Files

Use the env file that matches the way you start the project:

- `/.env` - Docker Compose from the repository root
- `/.env.example` - example for the root Docker Compose env
- `backend/.env` - local backend development
- `backend/.env.example` - example for local backend env
- `frontend/.env.local` - local frontend development
- `frontend/.env.local.example` - example for local frontend env

## What To Edit

- If you run `docker compose ...`, edit `/.env`
- If you run backend locally with `uv run ...`, edit `backend/.env`
- If you run frontend locally with `npm run dev`, edit `frontend/.env.local`

## Source Of Truth By Context

There is no single env file for every context.

- Docker has its own source of truth: `/.env`
- Local backend has its own source of truth: `backend/.env`
- Local frontend has its own source of truth: `frontend/.env.local`

That separation is intentional, because Docker, FastAPI, and Next.js read envs in different ways.
