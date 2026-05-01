# Тестирование и валидация

---

## **Цели тестирования**

1. Проверить, что **HTML-страницы содержат предзагруженные данные** (SSR).
2. Убедиться, что **кеширование работает** (повторные запросы не пересчитывают данные).
3. Проверить **инвалидацию кеша** при изменениях в админке.
4. Убедиться, что **лоадер отображается** при долгих вычислениях.

---

## **Инструменты**

Используем **нативные инструменты Nuxt 4** для тестирования:

- **`vitest`**: Встроенный тестовый фреймворк для Nuxt 4 (заменяет Jest/Playwright для простых случаев).
- **`$fetch` и `useAsyncData`**: Для проверки загрузки данных на сервере и клиенте.
- **Логи**: Проверка работы кеша через `useStorage` и консоль.

---

## **Критические тесты**

### **1. Тест главной страницы**

**Цель**: Проверить, что главная страница отображает количество возможных вариантов и использует кеш.

#### **Тест на серверной стороне (SSR)**

```ts
// ~/tests/main-page.test.ts
import { describe, it, expect } from 'vitest';
import { \$fetch } from 'ofetch';

describe('Главная страница', () => {
  it('Отображает количество вариантов', async () => {
    // Симулируем запрос к API (или используем мок)
    const response = await \$fetch('/api/knowledge-base');
    expect(response).toHaveProperty('payload.works');
    expect(response.payload.works.length).toBeGreaterThan(0);
  });

  it('Кеширует данные', async () => {
    // Первый запрос
    const startTime = Date.now();
    await \$fetch('/api/knowledge-base');
    const firstRequestTime = Date.now() - startTime;

    // Второй запрос (должен быть быстрее из-за кеша)
    const secondStartTime = Date.now();
    await \$fetch('/api/knowledge-base');
    const secondRequestTime = Date.now() - secondStartTime;

    expect(secondRequestTime).toBeLessThan(firstRequestTime);
  });
});
```
