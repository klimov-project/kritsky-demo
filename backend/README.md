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

2. Создайте файл `backend/.env` (локальный backend читает переменные именно из него).  
Если у вас уже есть корневой `.env` для Docker Compose, можно взять его за основу:

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

## Схема env-файлов

- `/.env` - используется Docker Compose из корня проекта
- `backend/.env` - используется для локального запуска backend
- `frontend/.env.local` - используется для локального запуска frontend

## Конфиги backend

- `db/config.py` - только настройки БД и тестовой БД
- `api/config.py` - JWT, admin, Redis и cache-related настройки
- `core/config.py` - Minio/S3 и другие core-интеграции
