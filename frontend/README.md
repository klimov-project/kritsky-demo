# Frontend (Next.js)

Клиентская часть проекта на Next.js (App Router).

## Требования

- Node.js 20+
- npm 10+

## Локальный запуск (без Docker)

1. Перейдите в директорию фронтенда:

```bash
cd frontend
```

2. Установите зависимости:

```bash
npm ci
```

3. Создайте `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Запустите dev-сервер:

```bash
npm run dev
```

5. Проверьте в браузере: [http://localhost:3000](http://localhost:3000)

## Сборка и запуск production локально

```bash
cd frontend
npm run build
npm start
```

## Запуск через Docker Compose (из корня проекта)

1. В корневом `.env` задайте:

```env
NEXT_PUBLIC_API_URL=https://ege.kritsky.academy
```

2. Пересоберите frontend (обязательно, переменная вшивается в bundle):

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

## Важно про `NEXT_PUBLIC_API_URL`

`NEXT_PUBLIC_API_URL` читается во время `build`.  
Если изменить переменную и не пересобрать фронтенд, запросы продолжат идти по старому адресу (или в текущий origin как относительные `/api/...`).
