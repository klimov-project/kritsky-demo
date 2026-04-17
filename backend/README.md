# Backend (FastAPI)

Серверная часть проекта: FastAPI + PostgreSQL + Redis + Alembic.

## Требования

- Python 3.13+
- [uv](https://docs.astral.sh/uv/)
- PostgreSQL 16+
- Redis 7+

## Локальный запуск (без Docker)

1. Перейдите в директорию backend:

```bash
cd backend
```

2. Создайте файл `backend/.env` (backend читает переменные именно из него).  
Можно скопировать из корня:

```bash
cp ../.env .env
```

3. Установите зависимости:

```bash
uv sync
```

4. Примените миграции:

```bash
uv run alembic upgrade head
```

5. Запустите API:

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

6. Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

## Запуск через Docker Compose (из корня проекта)

```bash
docker compose up -d db redis backend
```

Backend контейнер сам выполняет:
- `alembic upgrade head`
- запуск `uvicorn` на `:8000`

## Основные переменные окружения

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_ALGORITHM`
- `JWT_ACCESS_EXPIRE_MINUTES`, `JWT_REFRESH_EXPIRE_DAYS`
- `ADMIN_LOGIN`, `ADMIN_PASSWORD`, `ADMIN_EMAILS`
- `REDIS_URL`
