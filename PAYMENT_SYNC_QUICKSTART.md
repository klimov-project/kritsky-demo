### Скрипт для поднятия Синхронизация Платежей

```bash
#!/bin/bash

# 2. Убедиться что контейнеры запущены
echo "Starting containers..."
docker compose up -d

# 3. Подождать пока backend будет готов
echo "Waiting for backend to be ready..."
sleep 15

# 4. Применить миграцию БД
echo "Applying database migration..."
docker docker compose exec backend uv run alembic upgrade head

# 5. Перезагрузить backend для подтверждения
echo "Restarting backend..."
docker compose restart backend

echo "✅ Готово! Система синхронизации платежей активирована"
echo ""
echo "📊 Проверить логи:"
echo "  docker compose logs -f backend | grep PaymentSync"
echo ""
echo "🧪 Создать тестовый платеж:"
echo "  Смотри PAYMENT_SYNC_TESTING.md"
```

### Или команды по отдельности

```bash
# 1. Запустить контейнеры
docker compose up -d

# 2. Подождать немного
sleep 15

# 3. Применить миграцию
docker compose exec backend alembic upgrade head

# 4. Перезагрузить backend
docker compose restart backend

# 5. Проверить что background task запущен
docker compose logs -f backend
```

### Проверить что все работает

```bash
# В новом терминале посмотреть логи
docker compose logs -f backend | grep -E "(PaymentSync|listening)"

# Должны видеть:
# - "Uvicorn running on" - backend готов
# - "[PaymentSync]" - background task работает
```

### Быстро всё откатить назад (если нужно)

```bash
# Откатить миграцию
docker compose exec backend alembic downgrade -1

# Перезагрузить backend
docker compose restart backend
```

---

**💡 Pro Tips:**

- Background task работает каждые 30 сек - не нужно ничего делать вручную
- Webhook срабатывает мгновенно - это быстрее чем фоновая синхронизация
- Если платежи не обновляются, запустить: `curl -X POST http://localhost:8000/api/payments/sync -H "Authorization: Bearer YOUR_TOKEN"`

**📚 Документация:**

- Полная информация: [PAYMENT_STATUS_SYNC.md](PAYMENT_STATUS_SYNC.md)
- Тестирование: [PAYMENT_SYNC_TESTING.md](PAYMENT_SYNC_TESTING.md)
- Резюме: [IMPLEMENTATION_PAYMENT_SYNC.md](IMPLEMENTATION_PAYMENT_SYNC.md)
