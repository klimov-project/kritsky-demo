# Система кеширования kb на Nuxt 4

## Как сейчас делаются запросы kb:

### 1. **Композабл `useKnowledgeBase()`** — основной запрос

```typescript
const { data, pending, error, refresh } = useFetch<KnowledgeBaseResponse>(
  '/api/knowledge-base', // ← запрос к Nitro
  {
    server: true,
    key: 'knowledge-base',
    // ...
  },
);
```

Этот `useFetch` вызывает **Nitro роут** `/api/knowledge-base` → который исполняется в файле `server/api/knowledge-base.get.ts` → который делает запрос к бэкенду.

## Точка входа

### Цепочка запроса

```
Компонент → useKnowledgeBase() → useFetch('/api/knowledge-base')
                                       ↓
                                 Nitro сервер
                                       ↓
                            server/api/knowledge-base.get.ts
                                       ↓
                         ① GET /api/knowledge-base/cache/meta (лёгкий)
                         ↓ (если изменился)
                         ② GET бэкенд:8000/knowledge-base (тяжёлый)
                                       ↓
                         enrichPayload() — вычисляем variantsCount
                                       ↓
                         useStorage('cache').setItem(...)
                                       ↓
                         Ответ клиенту → store.hydrate()
```

Важно: **запрос делает только композабл через `useFetch('/api/knowledge-base')`**, который идёт в Nitro роут, где осуществляется кеширование. Стор используем только для хранения данных и геттеров.
