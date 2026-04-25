# План: Версионирование заданий и переход на ссылки

## Контекст

Текущая база знаний хранится как единый JSON-блоб (~9.5 МБ) в таблице `knowledge_base_state`.
При сохранении варианта или покупке сборника весь текст заданий копируется целиком.

**Цели:**
- Нормализовать задания в реляционные таблицы с поштучным версионированием
- Избежать дублирования при сохранении вариантов и сборников
- Позволять ссылаться на конкретные версии заданий
- Сохранить обратную совместимость с текущим JSON-блобом (удалить его позже)

---

## Текущая структура данных

### Иерархия

```
knowledge_base_state.payload
├── works (12)
│   ├── commonTasks: task1, task2, task3
│   └── excerpts (169)
│       ├── tasks: customTask1/2/3, task4_1, task4_2, task5
│       └── excludes: excludeTask1Ids, excludeTask2Ids, ...
├── poets (5)
│   └── poems (10)
│       └── tasks: task6, task7, task8, task9_1, task9_2, task10
├── block3
│   └── task11_1 (225), task11_2_3 (503), task11_4 (714), task11_5 (200)
└── settings
```

### Статистика заданий (~7 500 шт.)

| Расположение | Тип | Кол-во | Формат |
|:---|:---|---:|:---|
| work → commonTasks | task1 | 174 | short_answer |
| work → commonTasks | task2 | 90 | match |
| work → commonTasks | task3 | 271 | two_gap |
| excerpt → tasks | customTask1 | 151 | short_answer |
| excerpt → tasks | customTask2 | 5 | match |
| excerpt → tasks | customTask3 | 1825 | two_gap |
| excerpt → tasks | task4_1 | 387 | essay |
| excerpt → tasks | task4_2 | 388 | essay |
| excerpt → tasks | task5 | 2026 | essay |
| poem → tasks | task6 | 348 | two_gap |
| poem → tasks | task7 | 105 | short_answer |
| poem → tasks | task8 | 8 | multi_choice |
| poem → tasks | task9_1 | 17 | essay |
| poem → tasks | task9_2 | 18 | essay |
| poem → tasks | task10 | 13 | essay |
| block3 | task11_1 | 225 | essay_block3 |
| block3 | task11_2_3 | 503 | essay_block3 |
| block3 | task11_4 | 714 | essay_block3 |
| block3 | task11_5 | 200 | essay_block3 |

### Форматы полей

**short_answer** (task1, task7, customTask1):
`id, text, answer, termId, authorId, tags, isTermQuestion, isActive`

**two_gap** (task3, task6, customTask3):
`id, part1, part2, answer1, answer2, termId1, termId2, tags, withoutAuthor`

**match** (task2, customTask2):
`id, prompt, leftLabel, rightLabel, pairs[{character, properties, phrases, characteristics, propertyIds, tag}], extraOption, termId, authorId, characterSource, pairPropertyType, tags, characterCount`

**multi_choice** (task8):
`id, prompt, options[{id, term, termId, isCorrect, isActive}], termId, tags`

**essay** (task4_1, task4_2, task5, task9_1, task9_2, task10):
`id, text, termId, authorId, theme1Id, theme2Id, similarityId, themeInternalId, publicId, tags`

**essay_block3** (task11_*):
`id, text, workId, authorId/authorIds, termId, rodId, questionId, special, themeInternalId, publicId, tags, isActive`

---

## Новая структура БД

### Принципы

1. **Поштучное версионирование**: Каждое задание версионируется независимо.
2. **Иммутабельные версии**: Редактирование = INSERT новой строки, не UPDATE.
3. **Отдельные связующие таблицы**: `saved_variant_tasks` и `order_item_tasks` — самостоятельные таблицы, не меняющие существующие.
4. **JSON-блоб остаётся**: `knowledge_base_state` продолжает работать как source of truth для рандомайзера. Удалить позже.

---

### Таблица 1: `kb_authors`

```sql
CREATE TABLE kb_authors (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,   -- "АНОстровский"
    name VARCHAR(255) NOT NULL,                 -- "А.Н. Островский"
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица 2: `kb_works`

```sql
CREATE TABLE kb_works (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,   -- "work-e04y917i"
    work_code VARCHAR(255),                     -- "work-id-il6yxvng"
    author_id INTEGER REFERENCES kb_authors(id),
    title VARCHAR(500) NOT NULL,
    age18 BOOLEAN DEFAULT FALSE,
    internal_tags TEXT DEFAULT '',
    external_tags TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица 3: `kb_excerpts`

```sql
CREATE TABLE kb_excerpts (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,   -- "excerpt-qeoxi4bc"
    excerpt_code VARCHAR(255),                  -- "excerpt-id-7zlmf55m"
    work_id INTEGER REFERENCES kb_works(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    title TEXT NOT NULL,
    chapter VARCHAR(500) DEFAULT '',
    theme_internal_id VARCHAR(255) DEFAULT '',
    text TEXT NOT NULL,                         -- HTML текст отрывка
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица 4: `kb_poems`

```sql
CREATE TABLE kb_poems (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE NOT NULL,   -- "poem-sdlmfmte"
    poem_code VARCHAR(255),                     -- "poem-id-bro9gi9l"
    author_id INTEGER REFERENCES kb_authors(id),
    title VARCHAR(500) NOT NULL,
    text TEXT NOT NULL,                         -- HTML текст стихотворения
    age18 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Таблица 5: `kb_tasks` (центральная)

```sql
CREATE TABLE kb_tasks (
    -- Идентификация
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,          -- "task1-hurpfhx8" (стабильный)
    version INTEGER NOT NULL DEFAULT 1,

    -- Классификация
    task_type VARCHAR(30) NOT NULL,             -- "task1","task2",...,"task11_4"
    format VARCHAR(30) NOT NULL,                -- "short_answer","two_gap","match",
                                                --  "multi_choice","essay","essay_block3"
    scope VARCHAR(30) NOT NULL,                 -- "common","excerpt","poem","block3"

    -- Привязка к контенту (зависит от scope)
    work_id INTEGER REFERENCES kb_works(id),
    excerpt_id INTEGER REFERENCES kb_excerpts(id),
    poem_id INTEGER REFERENCES kb_poems(id),

    -- Индексируемые метаданные
    is_active BOOLEAN DEFAULT TRUE,
    author_id VARCHAR(255) DEFAULT '',
    term_id VARCHAR(255) DEFAULT '',
    tags VARCHAR(1000) DEFAULT '',

    -- Контент задания (формат зависит от format)
    content JSONB NOT NULL,

    -- Версионирование
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255) DEFAULT 'system',

    UNIQUE(external_id, version)
);

CREATE INDEX idx_kb_tasks_type ON kb_tasks(task_type);
CREATE INDEX idx_kb_tasks_scope ON kb_tasks(scope);
CREATE INDEX idx_kb_tasks_work ON kb_tasks(work_id) WHERE work_id IS NOT NULL;
CREATE INDEX idx_kb_tasks_excerpt ON kb_tasks(excerpt_id) WHERE excerpt_id IS NOT NULL;
CREATE INDEX idx_kb_tasks_poem ON kb_tasks(poem_id) WHERE poem_id IS NOT NULL;
CREATE INDEX idx_kb_tasks_active_lookup ON kb_tasks(external_id, is_active);
CREATE INDEX idx_kb_tasks_active_version ON kb_tasks(external_id, version DESC);
```

### Содержимое `content` JSONB по формату

| Формат | Поля в `content` |
|:---|:---|
| `short_answer` | `text`, `answer`, `isTermQuestion` |
| `two_gap` | `part1`, `part2`, `answer1`, `answer2`, `termId1`, `termId2`, `withoutAuthor` |
| `match` | `prompt`, `leftLabel`, `rightLabel`, `pairs`, `extraOption`, `characterSource`, `pairPropertyType`, `characterCount` |
| `multi_choice` | `prompt`, `options` |
| `essay` | `text`, `theme1Id`, `theme2Id`, `similarityId`, `themeInternalId`, `publicId` |
| `essay_block3` | `text`, `workId`, `authorIds`, `rodId`, `questionId`, `special`, `themeInternalId`, `publicId` |

### Таблица 6: `kb_excerpt_exclusions`

```sql
CREATE TABLE kb_excerpt_exclusions (
    id SERIAL PRIMARY KEY,
    excerpt_id INTEGER REFERENCES kb_excerpts(id) ON DELETE CASCADE,
    exclusion_type VARCHAR(50) NOT NULL,        -- "task1_id", "task2_id", "task3_id",
                                                --  "task2_property", "task2_character"
    excluded_value VARCHAR(255) NOT NULL,       -- ID задания или пары
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(excerpt_id, exclusion_type, excluded_value)
);
```

### Таблица 7: `saved_variant_tasks` (новая, отдельная)

Не модифицирует `saved_variants`. Работает параллельно.
В будущем станет основой для нового механизма сохранения вариантов.

```sql
CREATE TABLE saved_variant_tasks (
    id SERIAL PRIMARY KEY,
    saved_variant_id INTEGER REFERENCES saved_variants(id) ON DELETE CASCADE,
    task_id INTEGER NOT NULL REFERENCES kb_tasks(id),
    task_slot VARCHAR(30) NOT NULL,             -- "task1","task2","task3","task4_1",...
    slot_order INTEGER DEFAULT 0,               -- порядок внутри слота (для task11)

    -- Результат рандомизации, специфичный для конкретного показа.
    -- Для task2: выбранные пары и свойства.
    -- Для task8: выбранные опции.
    -- Для простых типов: NULL.
    runtime_snapshot JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(saved_variant_id, task_slot, slot_order)
);

CREATE INDEX idx_svt_variant ON saved_variant_tasks(saved_variant_id);
```

### Таблица 8: `order_item_tasks` (новая, для сборников)

Аналог `saved_variant_tasks`, но для купленных сборников.
Один `order_item` содержит N вариантов, каждый вариант — набор заданий.

```sql
CREATE TABLE order_item_tasks (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER REFERENCES order_items(id) ON DELETE CASCADE,
    variant_index INTEGER NOT NULL DEFAULT 0,   -- номер варианта в сборнике (0..N-1)
    task_id INTEGER NOT NULL REFERENCES kb_tasks(id),
    task_slot VARCHAR(30) NOT NULL,
    slot_order INTEGER DEFAULT 0,
    runtime_snapshot JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(order_item_id, variant_index, task_slot, slot_order)
);

CREATE INDEX idx_oit_order_item ON order_item_tasks(order_item_id);
```

---

## Фазы внедрения

### Фаза 1: Создание таблиц + миграция данных

**Задачи:**
1. Alembic-миграция: создать все 8 таблиц.
2. Python-скрипт `migrate_kb_to_tables.py`:
   - Парсит `knowledge_base_state.payload`.
   - Заполняет `kb_authors`, `kb_works`, `kb_excerpts`, `kb_poems`.
   - Раскладывает ~7500 заданий в `kb_tasks` (version=1, is_active=True).
   - Заполняет `kb_excerpt_exclusions`.
3. Скрипт идемпотентный (можно запускать повторно).
4. Валидация: кол-во записей в `kb_tasks` == кол-во заданий в JSON.

**Не затрагивает:**
- Рандомайзер (продолжает работать с JSON).
- `saved_variants` (существующая таблица не меняется).
- `order_items` (существующая таблица не меняется).

### Фаза 2: Двойная запись

**Задачи:**
1. При `POST /api/variants` (сохранение варианта):
   - Продолжаем писать `variant_payload` (snapshot) — обратная совместимость.
   - Дополнительно заполняем `saved_variant_tasks` ссылками на `kb_tasks.id`.
   - Для task2/task8 сохраняем `runtime_snapshot` с выбранными парами/опциями.
2. При `checkout` (покупка сборника):
   - Продолжаем писать `order_items.payload` (snapshot).
   - Дополнительно заполняем `order_item_tasks`.
3. При чтении — по-прежнему из JSON-полей (snapshot).

### Фаза 3: Переключение чтения на ссылки

**Задачи:**
1. Чтение сохранённого варианта:
   - Если есть записи в `saved_variant_tasks` → собрать из `kb_tasks`.
   - Если нет (старые варианты) → fallback на `variant_payload`.
2. Чтение сборника:
   - Если есть записи в `order_item_tasks` → собрать из `kb_tasks`.
   - Если нет → fallback на `order_items.payload`.
3. `variant_payload` и `order_items.payload` становятся nullable.

### Фаза 4 (будущее): Рефакторинг рандомайзера

1. Рандомайзер переходит на чтение из `kb_tasks` вместо JSON-блоба.
2. Удаление `knowledge_base_state.payload`.
3. Админка редактирует задания напрямую в `kb_tasks` (с созданием новых версий).

> **Замечание:** Фаза 4 затрагивает ядро генерации вариантов (randomizer v1 + v2, ~4000 строк кода).
> Требует отдельного планирования после стабилизации Фаз 1–3.

---

## Механика версионирования

### Создание версии (при редактировании задания)

```python
# Админ изменил текст задания task1-hurpfhx8
# 1. Деактивируем текущую версию
UPDATE kb_tasks SET is_active = FALSE
WHERE external_id = 'task1-hurpfhx8' AND is_active = TRUE;

# 2. Создаём новую версию
INSERT INTO kb_tasks (external_id, version, task_type, format, scope, content, ...)
VALUES ('task1-hurpfhx8', 2, 'task1', 'short_answer', 'common', '{"text": "Новый текст..."}', ...);
```

### Получение актуальной версии

```sql
SELECT * FROM kb_tasks
WHERE external_id = 'task1-hurpfhx8' AND is_active = TRUE;
```

### Получение версии из сохранённого варианта

```sql
SELECT kt.* FROM saved_variant_tasks svt
JOIN kb_tasks kt ON kt.id = svt.task_id
WHERE svt.saved_variant_id = 42
ORDER BY svt.task_slot, svt.slot_order;
```

Ссылка `svt.task_id` указывает на конкретную строку (конкретную версию).
Даже если появится version=3, пользователь увидит version=1, на которую была создана ссылка.

---

## Примеры данных

### kb_tasks: short_answer (task1)

| id | external_id | version | task_type | format | scope | work_id | content |
|:---|:---|:---|:---|:---|:---|:---|:---|
| 1 | task1-hurpfhx8 | 1 | task1 | short_answer | common | 1 | `{"text": "К какому роду...", "answer": "драма", "isTermQuestion": true}` |

### kb_tasks: match (task2)

| id | external_id | version | task_type | format | scope | work_id | content |
|:---|:---|:---|:---|:---|:---|:---|:---|
| 175 | task2-ezjbroic | 1 | task2 | match | common | 1 | `{"prompt": "Установите...", "pairs": [...], ...}` |

### saved_variant_tasks

| saved_variant_id | task_id | task_slot | runtime_snapshot |
|:---|:---|:---|:---|
| 42 | 1 | task1 | NULL |
| 42 | 175 | task2 | `{"selectedPairs": [...], "selectedProperties": [...]}` |
| 42 | 300 | task3 | NULL |

### order_item_tasks (сборник из 3 вариантов)

| order_item_id | variant_index | task_id | task_slot | runtime_snapshot |
|:---|:---|:---|:---|:---|
| 10 | 0 | 1 | task1 | NULL |
| 10 | 0 | 175 | task2 | `{...}` |
| 10 | 1 | 5 | task1 | NULL |
| 10 | 1 | 180 | task2 | `{...}` |
| 10 | 2 | 12 | task1 | NULL |
| 10 | 2 | 182 | task2 | `{...}` |
