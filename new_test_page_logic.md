# Логика страницы new_test.vue

## Общая структура страницы

Страница `new_test.vue` представляет собой конструктор вариантов ЕГЭ с разделением на компоненты для лучшей модульности и поддерживаемости.

## Деление на блоки

### 1. Весь вариант (главный контейнер)

- **Цель**: Основной контейнер страницы с общими стилями и макетом
- **Содержимое**:
  - Header страницы с заголовком и кнопкой генерации
  - Основной контент с sidebar и вариантом
- **Стили**: `min-h-screen bg-gray-50` - минимальная высота экрана, светло-серый фон

### 2. Текстовые блоки

- **Header страницы**: Заголовок "Конструктор вариантов ЕГЭ" и описание
- **Кнопка генерации**: Красная кнопка с закругленными углами (`rounded-[50px]`)
- **Состояния загрузки**: Спиннер и текст "Генерация..." / "Новый вариант"

### 3. Элементы управления/обновления блоков

- **Sidebar (NewTestSidebar)**: Фильтры и селекты для выбора произведения, главы, отрывка
- **Кнопка обновления блока 1**: "Обновить отрывок и задания 1–5"
- **Кнопка генерации нового варианта**: В header страницы

### 4. Элементы управления всем вариантом

- **Variant Header (NewTestVariantHeader)**: Бейджи варианта, вкладки режимов
- **Excerpt (NewTestExcerpt)**: Отображение текста отрывка с автором и произведением
- **Task Lists (NewTestTaskList)**:
  - Задания 1–5 (короткие ответы)
  - Часть 2 (развернутые ответы)

## Компонентная архитектура

### NewTestSidebar.vue

- **Пропы**: works, selectedWorkId, selectedChapter, selectedExcerptId, selectedWork, excerptChapters, excerptDropdownOptions, isLoading
- **Эмит**: update:selected-work-id, update:selected-chapter, update:selected-excerpt-id, refresh-block-1
- **Функционал**: Выбор произведения, главы, отрывка; кнопка обновления блока 1

### NewTestVariantHeader.vue

- **Пропы**: Нет (статический компонент)
- **Функционал**: Отображение номера варианта, вкладок режимов, описания

### NewTestExcerpt.vue

- **Пропы**: excerptText, excerptAuthor, excerptWork
- **Функционал**: Отображение текста отрывка с цитированием автора

### NewTestTaskList.vue

- **Пропы**: title, taskKeys, variant, showAnswers
- **Эмит**: toggle-answer
- **Функционал**: Список заданий с номерами, текстом, кнопками показа ответов

## Состояние и логика

### Реактивные переменные

- `selectedWorkId`: Выбранное произведение
- `selectedExcerptId`: Выбранный отрывок
- `selectedChapter`: Выбранная глава
- `showAnswers`: Объект с состояниями показа ответов по ключам заданий
- `isRefreshing`: Флаг генерации нового варианта

### Вычисляемые свойства

- `works`: Список произведений из knowledge-base
- `variant`: Данные варианта
- `selectedWork`: Выбранное произведение по ID
- `excerptChapters`: Уникальные главы из отрывков произведения
- `excerptDropdownOptions`: Опции для селекта отрывков

### Методы

- `toggleAnswer(key)`: Переключение показа ответа для задания
- `handleRefreshVariant()`: Генерация нового варианта
- `refreshBlock1()`: Обновление отрывка и заданий 1–5

## Стилизация

### Цветовая схема

- Основной красный: `#bd5343` (hover: `#ab4a3c`)
- Фон: `bg-gray-50`
- Карточки: `bg-white` с `shadow`
- Акценты: `text-gray-900`, `text-gray-600`

### Типографика

- Заголовки: `font-bold text-gray-900`
- Текст: `text-sm text-gray-600`
- Кнопки: `font-medium uppercase`

### Макет

- Контейнер: `max-w-6xl mx-auto px-4 py-6`
- Flexbox: `flex gap-6` для sidebar и контента
- Sidebar: `w-64 flex-shrink-0`
- Основной контент: `flex-1 min-w-0`

## API интеграция

### Knowledge Base

- URL: `/api/knowledge-base`
- Данные: works, poets
- Кеширование: SWR с 120s

### Variant

- URL: `/api/variants/runtime/pregenerated`
- Данные: variant с excerpt и tasks
- Кеширование: SWR с 300s

## Адаптивность

- Desktop: Sidebar слева, контент справа
- Mobile: Sidebar скрыт (`hidden lg:block`)
- Flexbox адаптация: `flex-col md:flex-row`
