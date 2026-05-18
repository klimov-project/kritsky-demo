# Система кеширования kb на Nuxt 4

## Как сейчас делаются запросы kb

### 1. Композабл `useKnowledgeBase()`

Фронтенд вызывает `useFetch('/api/knowledge-base')` с опцией `server: true`.

```typescript
const { data, pending, error, refresh } = useFetch<KnowledgeBaseResponse>(
  '/api/knowledge-base',
  {
    server: true,
    key: 'knowledge-base',
    // ...
  },
);
```

Это означает, что запрос выполняется на Nitro-сервере и не делается напрямую из браузера.

### 2. Nitro-ручка `/api/knowledge-base`

Реализация находится в `frontend/server/api/knowledge-base.get.ts`.

- В маршруте используется `defineCachedEventHandler`.
- Для кеша применяется `useStorage('cache')` с драйвером Redis, настроенным через `nuxt.config.ts`.
- Сервис бэкенда доступен через `useRuntimeConfig().apiBackendUrl`.

## Реальный поток данных

```
Компонент → useKnowledgeBase() → useFetch('/api/knowledge-base')
                                       ↓
                                Nitro-сервер фронтенда
                                       ↓
                            frontend/server/api/knowledge-base.get.ts
                                       ↓
  1) GET /knowledge-base/cache/meta на бэкенде — лёгкий fingerprint-запрос
                                       ↓
             Если fingerprint совпадает:
                useStorage('cache').getItem('knowledge-base')
                return cached payload
                                       ↓
             Иначе:
  2) GET /knowledge-base на бэкенде — полный тяжёлый payload
                                       ↓
                         enrichPayload(rawPayload)
                                       ↓
                         useStorage('cache').setItem('knowledge-base', ...)
                                       ↓
                         Ответ клиенту / Nuxt payload
                                       ↓
                        useKnowledgeBase().transform -> store.hydrate()
```

## Что уже есть и что важно

- В `frontend/server/api/knowledge-base.get.ts` сейчас сохраняется в Redis объект с `payload` и `fingerprint`.
- Этот кеш работает как: если backend fingerprint не изменился, возвращается сохранённый результат.
- `defineCachedEventHandler` добавляет `maxAge` и `swr: true`, то есть после истечения `maxAge` ответ может быть stale, а обновление делается в фоне.
- В `frontend/app/composables/useKnowledgeBase.ts` `useFetch` получает ответ и гидрирует Pinia-стор только если hash изменился.

## Текущее ограничение

На данный момент реализация `server/api/knowledge-base.get.ts`:

- берёт полный payload от бэкенда;
- добавляет только `_metadata` и `variantsCount`;
- кеширует весь этот объект в Redis;
- возвращает клиенту весь обогащённый payload.

Это значит, что во время SSR / пререндеринга Nuxt payload будет содержать весь тяжёлый JSON, и `routeRules` для `/api/knowledge-base` не спасают от того, что страница может раздуться.

## Как должна работать оптимизация

### Цель

- Тяжёлые данные должны оставаться в кеше Redis.
- В стор попадают только уже обработанные облегчённые данные.
- Обработка должна происходить на Nitro-сервере до того, как ответ уходит клиенту или попадает в Nuxt-пayload.

### Схема оптимального потока

```
Компонент → useKnowledgeBase() → useFetch('/api/knowledge-base')
                                       ↓
                                Nitro-сервер фронтенда
                                       ↓
                            frontend/server/api/knowledge-base.get.ts
                                       ↓
  1) GET /knowledge-base/cache/meta на бэкенде
                                       ↓
  2) если изменился fingerprint — GET /knowledge-base (тяжёлый)
                                       ↓
  3) transformToKnowledgeBasePayload(rawPayload)
                                       ↓
  4) enrichPayload(lightPayload)
                                       ↓
  5) useStorage('cache').setItem('knowledge-base', { payload: lightPayload, fingerprint })
                                       ↓
                         Ответ клиенту → лёгкий payload
                                       ↓
                       store.hydrate(lightPayload)
```

## Как применить `transformToKnowledgeBasePayload`

Функция теперь вынесена в `frontend/server/utils/kb_mapping.ts` и импортируется в `frontend/server/api/knowledge-base.get.ts`.

Она делает следующее:

- сохраняет только нужные поля для клиентской логики: `works`, `poets`, `stats`, `settings`, `_metadata`;
- удаляет из `work` поля `commonTasks` и `characters`;
- оставляет только метаданные отрывков, а не полный `text`, `textSecondColumn` и `tasks`;
- добавляет счётчики:
  - `exercisesCount` по блокам `task1/task2/task3`;
  - `excerptsCount`;
  - `hasText` и `tasksCount` для каждого отрывка;
- формирует список `poets` через уникальные `authorId` из `works`.

Эта функция идеально подходит для серверного преобразования, потому что именно она превращает тяжёлый raw payload в лёгкий `KnowledgeBasePayload`, который должен жить в Pinia.

## Рекомендуемое улучшение

1. Вынести `transformToKnowledgeBasePayload` из клиента в общую утилиту/серверную функцию или импортировать её в `frontend/server/api/knowledge-base.get.ts`.
2. На Nitro-сервере после получения полного backend-пayload выполнить:
   - `const lightPayload = transformToKnowledgeBasePayload(rawPayload);`
   - `const enriched = enrichPayload(lightPayload);`
3. Кешировать `enriched` или `lightPayload` в Redis;
4. Возвращать из `/api/knowledge-base` уже `enriched` лёгкий payload.

## Обновлённая схема данных

### Тяжёлый backend payload

Содержит полную структуру:

- `works` с `commonTasks`, `characters`, `excerpts` и полными `text`/`tasks`;
- `poets` со списками стихов;
- `block3` с массивами заданий;
- `settings` и другие большие вложения.

### Лёгкий frontend payload

В стор должны попадать только:

- `works[]` с сокращёнными отрывками;
- `poets[]` с метаданными авторов;
- `stats`, `settings`;
- `_metadata` с `hash`, `fetchedAt`, `computed.{variantsCount, poetsCount, totalEntities}`.

## Структура KB в Pinia

В `frontend/app/stores/knowledgeBase.ts` стор должен хранить:

- `knowledgeBase.works` — сокращённые метаданные для списка произведений и фильтрации;
- `knowledgeBase.poets` — уникальные авторы для фильтров;
- `knowledgeBase.stats` и `knowledgeBase.settings`;
- `_metadata.computed.variantsCount` — общее число вариантов.

В `frontend/app/components/variant/Create.vue` используются:

- `kbStore.works` — для выбора и фильтрации по произведению и отрывку;
- `kbStore.poets` — для фильтрации по автору;
- `variantsCount` — для отображения общего числа вариантов.

## Что обязательно учесть для Nuxt пререндеринга

- Пререндер `/` и `useFetch('/api/knowledge-base')` означает, что ответ API будет включён в Nuxt payload.
- Поэтому важно, чтобы `/api/knowledge-base` возвращал уже компактный результат.
- Если возвращается весь raw payload, страница и `payload.js` раздуются на десятки мегабайт.
- Redis кеш оптимизирует повторные запросы, но не решает проблему размера ответа при первом рендере.

## Вывод

Текущая архитектура правильная по идее:

- `useFetch` ходит через Nitro;
- `useStorage('cache')` с Redis хранит кеш;
- `useKnowledgeBase()` гидрирует Pinia только по изменённому хешу.

Но нужно перенести тяжёлое преобразование на сервер и отдавать клиенту уже `transformToKnowledgeBasePayload`.

Это позволит:

- держать raw/тяжёлый JSON в Redis, а не в Nuxt payload;
- избежать раздувания `payload` при prerender;
- загрузить в стор только необходимые данные и метрики;
- сохранить актуальность по fingerprint/hash.
