# Функционал Синхронизации Статусов Платежей

## Обзор

Реализована полная система синхронизации статусов платежей Yookassa:

### 1. **Поле "kind" для различия типов платежей**

- Добавлено поле `kind` в таблицу `payments`
- Значения: `"order"` (заказ) или `"subscription"` (подписка)
- Обновлено при создании платежа

### 2. **Background Task для периодической синхронизации**

- Запускается автоматически при старте приложения
- Работает каждые 30 секунд
- Получает все платежи со статусом "pending"
- Проверяет статус через Yookassa API
- Обновляет БД при изменении статуса

### 3. **Обработка успешных платежей**

- **Для подписок**: создаёт/расширяет запись Subscription, устанавливает isPro=true
- **Для заказов**: отмечает заказ как Paid

## Использование

### Создание платежа с указанием типа

**Endpoint:** `POST /api/payments/create`

```json
{
  "amount": 99.99,
  "description": "Подписка на 1 месяц",
  "kind": "subscription",
  "order_id": null,
  "return_url": "http://localhost:3000/checkout/success"
}
```

Поле `kind` опционально, по умолчанию `"order"`

### Ручная синхронизация платежей

**Endpoint:** `POST /api/payments/sync`

Требует аутентификации.

**Response:**

```json
{
  "status": "synced",
  "synced": 42,
  "updated": 15,
  "errors": 0
}
```

## Архитектура

### Файлы

1. **backend/db/src/models.py** - Payment модель с полем `kind`
2. **backend/alembic/versions/005_add_kind_to_payments.py** - Миграция БД
3. **backend/api/src/payments/sync_service.py** - Сервис синхронизации
4. **backend/api/src/payments/router.py** - Endpoints и webhook
5. **backend/api/src/app.py** - Background task в lifespan

### Процесс синхронизации

```
Background Task (каждые 30 сек)
    ↓
Запрос pending платежей из БД
    ↓
Для каждого платежа:
    - Вызов yookassa_service.get_payment_status()
    - Если статус изменился:
        - Обновление paymentStatus в БД
        - Обработка side effects:
            - succeeded → создание Subscription или отметка Order как Paid
            - canceled/failed → никаких действий
    ↓
Коммит всех изменений
```

## Миграция БД

Для применения миграции (при запуске контейнеров):

```bash
docker compose exec backend alembic upgrade head
```

## Тестирование

### 1. Проверка создания платежа с kind="subscription"

```bash
curl -X POST http://localhost:8000/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 99.99,
    "description": "Test subscription",
    "kind": "subscription"
  }'
```

### 2. Запуск ручной синхронизации

```bash
curl -X POST http://localhost:8000/api/payments/sync \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Проверка статуса в БД

```sql
-- Проверить платежи с видом
SELECT id, userId, paymentStatus, kind, createdAt FROM payments
ORDER BY createdAt DESC LIMIT 10;

-- Проверить подписки
SELECT id, userId, dateOfExpire, createdAt FROM subscriptions
ORDER BY createdAt DESC LIMIT 10;
```

## Важные замечания

1. **Background Task** запускается при старте FastAPI и работает постоянно в фоне
2. **Webhook** остаётся основным способом получения обновлений от Yookassa (instant)
3. **Background Task** работает как fallback если webhook не сработал или был пропущен
4. **Миграция** должна быть применена перед запуском (добавляет поле kind с default="order")
5. При обновлении статуса платежа через webhook, background task также обновит записи если нужно

## Возможные проблемы

### Платежи остались в "pending"

1. Проверить логи backend: `docker compose logs backend | grep -i payment`
2. Запустить ручную синхронизацию: `POST /api/payments/sync`
3. Проверить credentials Yookassa в backend/.env

### Подписка не создалась после платежа

1. Проверить что `kind="subscription"` при создании платежа
2. Проверить что платеж действительно получил статус "succeeded" в Yookassa
3. Проверить логи: `docker compose logs backend | grep -i subscription`

## Следующие шаги

1. Применить миграцию БД
2. Перезагрузить backend контейнер
3. Тестировать создание платежей с `kind="subscription"`
4. Мониторить логи для проверки фонового таска
