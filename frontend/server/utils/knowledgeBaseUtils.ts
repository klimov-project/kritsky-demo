import { EMPTY_BLOCK3, DEFAULT_KNOWLEDGE_BASE_SETTINGS } from '@/utils/const';
import type { KnowledgeBasePayload } from '@/types/knowledgeBaseTypes';
import { filterActiveItems } from '@/utils/variantUtils';

/** HTML-тег */
const HTML_TAG_PATTERN = /<[^>]*>/g;

/** XML-комментарий */
const XML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;

/** Неразрывный пробел (HTML-entity или Unicode) */
const NBSP_PATTERN = /&nbsp;?| /gi;

/** Двойные и более пробелы */
const MULTISPACE_PATTERN = / {2,}/g;

/** Поля, которые нельзя очищать (идентификаторы) */
const ID_LIKE_KEYS = new Set([
  'id',
  'authorId',
  'termId',
  'theme1Id',
  'theme2Id',
  'termId1',
  'termId2',
  'workId',
  'excerptId',
  'poemId',
  'questionId',
  'publicId',
  'themeInternalId',
  'similarityId',
  'propertyIds',
  'shuffledRightOptionIds',
  'excludeTask1Ids',
  'excludeTask1TermIds',
  'excludeTask2Ids',
  'excludeTask2TermIds',
  'excludeTask3Ids',
  'excludeTask3TermIds',
  'authorIds',
  'rodId',
  'variantId',
  'taskKey',
]);

/** Очищает строку от HTML-разметки и лишних пробелов */
const sanitizeText = (value: string): string =>
  value
    .replace(NBSP_PATTERN, ' ')
    .replace(XML_COMMENT_PATTERN, '')
    .replace(HTML_TAG_PATTERN, ' ')
    .replace(MULTISPACE_PATTERN, ' ')
    .trim();

/** Проверяет, похожа ли строка на HTML (содержит теги) */
const looksLikeHtml = (value: string): boolean =>
  HTML_TAG_PATTERN.test(value) ||
  XML_COMMENT_PATTERN.test(value) ||
  NBSP_PATTERN.test(value);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Удаляет все style-атрибуты из HTML-строк во всех строковых полях объекта (рекурсивно)
 * Учитывает экранированные кавычки (&quot;) внутри значений атрибутов
 * @param {*} obj - объект или значение любой вложенности
 * @returns {*} - новый объект с очищенными строками
 */
function removeStyleAttributes(obj) {
  if (typeof obj === 'string') {
    // Сначала декодируем HTML-сущности в кавычках для упрощения парсинга,
    // затем удаляем style атрибуты, затем восстанавливаем сущности обратно.
    // Но лучше работать напрямую с регуляркой, учитывающей &quot;

    // Удаляем style="..." где внутри могут быть &quot; (экранированные кавычки)
    // и обычные кавычки, но не пересекающиеся с границами атрибута
    let result = obj.replace(
      /\s*style\s*=\s*"(?:[^"\\]|\\[\s\S]|&quot;)*"/gi,
      '',
    );

    // Удаляем style='...' (с одинарными кавычками)
    result = result.replace(
      /\s*style\s*=\s*'(?:[^'\\]|\\[\s\S]|&apos;)*'/gi,
      '',
    );

    // Удаляем возможные двойные пробелы, оставшиеся после удаления атрибутов
    result = result.replace(/\s{2,}/g, ' ');
    result = result.replace(/\s>/g, '>');

    return result;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeStyleAttributes(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = removeStyleAttributes(obj[key]);
    }
    return result;
  }

  return obj;
}

/**
 * Глубокая нормализация данных из БЗ:
 * - удаляет HTML-теги и XML-комментарии из всех строк, кроме ID-полей
 * - нормализует пробелы
 * - не трогает бинарные данные (Blob, File, ArrayBuffer и т.д.)
 * - рекурсивно проходит по вложенным объектам/массивам
 */
export const normalizeKB = <T>(data: T): T => {
  if (data === null || data === undefined) return data;

  // Бинарные и специальные типы — не трогаем
  if (
    data instanceof Date ||
    data instanceof RegExp ||
    data instanceof Blob ||
    data instanceof File ||
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data) ||
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    data instanceof ReadableStream ||
    data instanceof WeakMap ||
    data instanceof WeakSet
  ) {
    return data;
  }

  // Строки
  if (typeof data === 'string') {
    return looksLikeHtml(data) ? (sanitizeText(data) as T) : data;
  }

  // Массивы — рекурсивно
  if (Array.isArray(data)) {
    return data.map((item) => normalizeKB(item)) as T;
  }

  // Объекты
  if (isObject(data)) {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      // ID-поля не трогаем
      if (ID_LIKE_KEYS.has(key)) {
        result[key] = value;
        continue;
      }

      result[key] = normalizeKB(value);
    }

    return result as T;
  }

  // Примитивы (числа, булевы, символы и т.д.)
  return data;
};

export const normalizeKnowledgeBasePayload = (
  value: unknown,
): KnowledgeBasePayload => {
  const normalizedSource = normalizeKB(value);
  const normalizedSource2 = removeStyleAttributes(normalizedSource);
  console.log('[Normalise] removeStyleAttributes Ok');

  if (!normalizedSource2 || typeof normalizedSource2 !== 'object') {
    return {
      works: [],
      poets: [],
      themes: [],
      block3: { ...EMPTY_BLOCK3 },
      settings: DEFAULT_KNOWLEDGE_BASE_SETTINGS,
      stats: {},
      updatedAt: new Date(Date.now()),
    };
  }

  const source = normalizedSource as Partial<KnowledgeBasePayload>;

  const poets = Array.isArray(source.poets) ? source.poets : [];

  const themes = (() => {
    const theme1Set = new Set<string>();
    const theme2Set = new Set<string>();

    poets.forEach((poet) => {
      poet.poems?.forEach((poem) => {
        filterActiveItems(poem.tasks.task10).forEach((task) => {
          if (task.theme1Id) theme1Set.add(task.theme1Id);
          if (task.theme2Id) theme2Set.add(task.theme2Id);
        });
      });
    });

    const sortedTheme1 = Array.from(theme1Set).sort();
    const sortedTheme2 = Array.from(theme2Set).sort();

    const onlyTheme1 = sortedTheme1.filter((t) => !theme2Set.has(t));

    const options: { value: string; label: string; disabled?: boolean }[] = [];

    sortedTheme2.forEach((t) => options.push({ value: t, label: t }));

    if (sortedTheme2.length > 0 && onlyTheme1.length > 0) {
      options.push({ value: '---', label: '──────────', disabled: true });
    }

    onlyTheme1.forEach((t) => options.push({ value: t, label: t }));

    return options;
  })();

  return {
    works: Array.isArray(source.works) ? source.works : [],
    poets,
    themes,
    block3: source.block3 || { ...EMPTY_BLOCK3 },
    settings: source.settings || DEFAULT_KNOWLEDGE_BASE_SETTINGS,
    stats: source.stats ?? {},
    updatedAt: new Date(Date.now()),
    _metadata: source._metadata,
  };
};
