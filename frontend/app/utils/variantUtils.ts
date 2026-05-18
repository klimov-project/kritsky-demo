import type { MatchingQuestion, Excerpt } from '@/types/knowledgeBaseTypes';

export const isObjectRecord = (
  value: unknown,
): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object';
};

export const getTags = (value: unknown): string[] => {
  if (!isObjectRecord(value)) return [];
  return [...parseTagValue(value.tags), ...parseTagValue(value.tag)];
};

export const parseTagValue = (value: unknown): string[] => {
  if (!value) return [];

  const chunks: string[] = [];

  if (typeof value === 'string') {
    chunks.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (typeof entry === 'string') {
        chunks.push(entry);
      }
    });
  }

  const normalized = chunks
    .flatMap((entry) => entry.split(/[,\n;]+/u))
    .map((entry) => normalizeTag(entry))
    .filter(Boolean);

  return Array.from(new Set(normalized));
};

export const normalizeTag = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/^#+/u, '')
    .replace(/^тег\.?\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const normalizeTagKindToken = (value: string): string => {
  return normalizeTag(value)
    .replace(/[._-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getEntityThemeTokens = (value: unknown): string[] => {
  if (!isObjectRecord(value)) return [];
  const tokens = new Set<string>();
  parseIdentifierTokens(value.themeInternalId).forEach((token) =>
    tokens.add(token),
  );
  getTags(value).forEach((tag) => {
    const payload = getStructuredTagPayload(tag, 'тема');
    if (payload) {
      parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
    }
  });
  return Array.from(tokens);
};

export const getStructuredTagPayload = (
  value: string,
  expectedKind: string,
): string => {
  const normalized = normalizeTag(value);
  const normalizedKind = normalizeTagKindToken(expectedKind);

  if (!normalizedKind.length || normalized === normalizedKind) {
    return '';
  }

  if (
    normalized.startsWith(`${normalizedKind}:`) ||
    normalized.startsWith(`${normalizedKind}.`)
  ) {
    return normalized.slice(normalizedKind.length + 1).trim();
  }

  if (normalized.startsWith(`${normalizedKind} `)) {
    return normalized.slice(normalizedKind.length + 1).trim();
  }

  return '';
};

export const extractAuthorTokens = (
  value: unknown,
  fallbackAuthorId?: string,
): string[] => {
  const tokens = new Set<string>();

  readIdentifierField(value, 'authorId').forEach((token) => tokens.add(token));
  readIdentifierField(value, 'authorIds').forEach((token) => tokens.add(token));

  getTags(value).forEach((tag) => {
    const payload = getStructuredTagPayload(tag, 'автор');
    if (payload) {
      parseIdentifierTokens(payload).forEach((token) => tokens.add(token));
    }
  });

  if (fallbackAuthorId) {
    parseIdentifierTokens(fallbackAuthorId).forEach((token) =>
      tokens.add(token),
    );
  }

  return Array.from(tokens);
};

export const readIdentifierField = (
  value: unknown,
  field: string,
): string[] => {
  if (!isObjectRecord(value)) return [];
  return parseIdentifierTokens(value[field]);
};

export const parseIdentifierTokens = (value: unknown): string[] => {
  if (!value) return [];

  const chunks: string[] = [];
  if (typeof value === 'string') {
    chunks.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (typeof entry === 'string') {
        chunks.push(entry);
      }
    });
  }

  const normalized = chunks
    .flatMap((entry) => entry.split(/[,\n;]+/u))
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(normalized));
};
export const sortExcerptsByOrder = (excerpts: Excerpt[]): Excerpt[] => {
  return [...excerpts]
    .map((excerpt, index) => ({ excerpt, index }))
    .sort((a, b) => {
      const orderA = Number.isFinite(a.excerpt.order)
        ? a.excerpt.order
        : a.index + 1;
      const orderB = Number.isFinite(b.excerpt.order)
        ? b.excerpt.order
        : b.index + 1;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.index - b.index;
    })
    .map((entry) => entry.excerpt);
};

export const filterActiveItems = <T extends { isActive?: boolean }>(
  items: T[],
): T[] => {
  return items.filter((item) => item.isActive !== false);
};

export const getTask2RightOptions = (
  question: MatchingQuestion | null,
): string[] => {
  if (!question) return [];
  if (question.shuffledRightOptions) return question.shuffledRightOptions;

  const options = question.pairs
    .map(
      (pair) =>
        pair.properties.find((property) => property.trim())?.trim() || '',
    )
    .filter(Boolean);

  if (question.extraOption?.trim()) {
    options.push(question.extraOption.trim());
  }

  return options;
};

export const getTask2AnswerMap = (
  question: MatchingQuestion | null,
): Record<string, string> => {
  if (!question) return {};
  const map: Record<string, string> = {};
  const rightOptions = getTask2RightOptions(question);

  question.pairs.forEach((pair, index) => {
    const property = pair.properties.find((p) => p.trim())?.trim() || '';
    const optionIndex = rightOptions.findIndex(
      (opt) => opt.trim() === property,
    );
    if (optionIndex >= 0) {
      map[String.fromCharCode(65 + index)] = String(optionIndex + 1);
    }
  });
  return map;
};

export const getTask8CorrectOptionNumbers = (question: any): number[] => {
  if (!question || !question.options) return [];
  return question.options
    .map((opt: any, index: number) => (opt.isCorrect ? index + 1 : null))
    .filter((n: number | null): n is number => n !== null);
};

export const createEmptyTaskHistory = () => ({
  task1: [],
  task2: [],
  task3: [],
  task4: [],
  task5: [],
  task6: [],
  task7: [],
  task8: [],
  task9: [],
  task10: [],
  task11_1: [],
  task11_2_3: [],
  task11_4: [],
  task11_5: [],
  task12: [],
  task13: [],
  task14: [],
  task15: [],
  task16: [],
});

export const createEmptyCycleHistory = () => ({
  task1: [],
  task2: [],
  task3: [],
  task4: [],
  task5: [],
  task6: [],
  task7: [],
  task8: [],
  task9: [],
  task10: [],
  task11_1: [],
  task11_2_3: [],
  task11_4: [],
  task11_5: [],
  task12: [],
  task13: [],
  task14: [],
  task15: [],
  task16: [],
});

export const createTaskBooleanFlags = (initial: boolean) => ({
  task1: initial,
  task2: initial,
  task3: initial,
  task4: initial,
  task5: initial,
  task6: initial,
  task7: initial,
  task8: initial,
  task9: initial,
  task10: initial,
  task11_1: initial,
  task11_2_3: initial,
  task11_4: initial,
  task11_5: initial,
  task12: initial,
  task13: initial,
  task14: initial,
  task15: initial,
  task16: initial,
});

export const createBlockBooleanFlags = (initial: boolean) => ({
  block1: initial,
  block2: initial,
  block3: initial,
});
