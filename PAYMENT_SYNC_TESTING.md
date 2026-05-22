### Тестирование Синхронизации Платежей

## Шаг 1: Применить миграцию

```bash
# Перейти в директорию проекта
cd c:\Users\Роман\Documents\klimov-project\klimovproject\kritsky\ege.kritsky.academy-main2\ege.kritsky.academy-main

# Запустить контейнеры если не запущены
docker compose up -d

# Подождать пока backend будет готов (примерно 10 сек)
sleep 10

# Применить миграцию
docker compose exec backend alembic upgrade head
```

## Шаг 2: Проверить что background task работает

```bash
# Посмотреть логи backend
docker compose logs -f backend | grep -i payment
```

Должны видеть строки типа:

```
[PaymentSync] Synced 0, Updated 0, Errors 0
[PaymentSync] Synced 5, Updated 0, Errors 0
[PaymentSync] Synced 5, Updated 2, Errors 0
```

## Шаг 3: Тестировать создание платежа

### 3a. Получить токен авторизации

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "your_password"
  }' | jq .
```

Сохранить значение `access_token`

### 3b. Создать платеж для подписки

```bash
# Сохранить токен в переменную
TOKEN="your_access_token_here"

# Создать платеж подписки
curl -X POST http://localhost:8000/api/payments/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "description": "Подписка на месяц",
    "kind": "subscription"
  }' | jq .
```

Response должен содержать:

```json
{
  "payment_id": "...",
  "confirmation_url": "...",
  "status": "pending",
  "amount": "99.99"
}
```

## Шаг 4: Проверить статус в БД

```bash
# Подключиться к PostgreSQL контейнеру
docker compose exec postgres psql -U kritsky -d kritsky_db

# Внутри psql:
SELECT id, userId, paymentId, paymentStatus, kind, amount, createdAt
FROM payments
ORDER BY createdAt DESC LIMIT 5;

# Должны видеть свежий платеж с kind='subscription' и paymentStatus='pending'
```

## Шаг 5: Запустить ручную синхронизацию

```bash
curl -X POST http://localhost:8000/api/payments/sync \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Response:

```json
{
  "status": "synced",
  "synced": 5,
  "updated": 0,
  "errors": 0
}
```

## Шаг 6: Проверить что подписка была создана

Если платеж имел статус "succeeded" в Yookassa, должна была создана подписка:

```bash
# Внутри psql:
SELECT id, userId, paymentId, dateOfExpire, createdAt
FROM subscriptions
ORDER BY createdAt DESC LIMIT 5;

# Проверить что пользователь отмечен как Pro
SELECT id, email, isPro FROM users WHERE id = YOUR_USER_ID;
```

## Troubleshooting

### 1. Migration не применилась

```bash
# Проверить статус миграций
docker compose exec backend alembic current

# Если ошибка, просмотреть детали
docker compose exec backend alembic upgrade head --verbose
```

### 2. Background task не запустился

```bash
# Проверить логи
docker compose logs backend | tail -50

# Перезагрузить контейнер
docker compose restart backend
```

### 3. Платежи не обновляются

```bash
# Проверить credentials Yookassa в backend/.env
cat backend/.env | grep YOOKASSA

# Проверить логи для ошибок
docker compose logs backend | grep -i error
```

## Примеры SQL запросов для проверки

```sql
-- Все платежи в последнем часу
SELECT id, userId, paymentStatus, kind, amount, createdAt
FROM payments
WHERE createdAt > NOW() - INTERVAL '1 hour'
ORDER BY createdAt DESC;

-- Платежи со статусом pending
SELECT COUNT(*) as pending_count FROM payments WHERE paymentStatus = 'pending';

-- Платежи со статусом succeeded
SELECT COUNT(*) as succeeded_count FROM payments WHERE paymentStatus = 'succeeded';

-- Все подписки текущего пользователя
SELECT id, dateOfExpire, createdAt FROM subscriptions
WHERE userId = YOUR_USER_ID
ORDER BY createdAt DESC;

-- Активные подписки (не истекшие)
SELECT s.id, u.email, s.dateOfExpire
FROM subscriptions s
JOIN users u ON s.userId = u.id
WHERE s.dateOfExpire > NOW()
ORDER BY s.dateOfExpire DESC;
```

## Если всё работает

✅ Background task запущен и синхронизирует платежи каждые 30 сек
✅ Платежи создаются с правильным `kind`
✅ Подписки создаются когда платеж имеет статус "succeeded"
✅ Пользователи отмечаются как Pro после успешной подписки
✅ Webhook также работает и мгновенно обновляет статусы

---

**Когда все готово**, можно удалить этот файл - информация содержится в [PAYMENT_STATUS_SYNC.md](PAYMENT_STATUS_SYNC.md)
