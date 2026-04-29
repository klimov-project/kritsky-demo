import { EMPTY_BLOCK3 } from '@/consts/lib/knowledgeBaseApi';
import type {
  Block3Data,
  KnowledgeBaseSettings,
  Poet,
  VariantTextsSettings,
  Work,
} from '@/mocks/materials';
import { DEFAULT_KNOWLEDGE_BASE_SETTINGS } from '@/mocks/materials';

export interface KnowledgeBasePayload {
  works: Work[];
  poets: Poet[];
  block3: Block3Data;
  settings: KnowledgeBaseSettings;
}

export interface KnowledgeBaseResponse extends KnowledgeBasePayload {
  updatedAt: string | null;
}

const normalizeNbsp = (value: string): string =>
  value.replace(/&nbsp;?/giu, ' ').replace(/\u00A0/gu, ' ');

const normalizeNbspDeep = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return normalizeNbsp(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeNbspDeep(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        normalizeNbspDeep(entry),
      ]),
    );
  }

  return value;
};

const normalizeSettings = (value: unknown): KnowledgeBaseSettings => {
  const source =
    value && typeof value === 'object'
      ? (value as Partial<KnowledgeBaseSettings>)
      : {};
  const variantTexts: Partial<VariantTextsSettings> =
    source.variantTexts && typeof source.variantTexts === 'object'
      ? (source.variantTexts as Partial<VariantTextsSettings>)
      : {};

  return {
    variantTexts: {
      part1Intro:
        typeof variantTexts.part1Intro === 'string'
          ? variantTexts.part1Intro
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part1Intro,
      part1QuestionsIntro:
        typeof variantTexts.part1QuestionsIntro === 'string'
          ? variantTexts.part1QuestionsIntro
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part1QuestionsIntro,
      part1Task4Lead:
        typeof variantTexts.part1Task4Lead === 'string'
          ? variantTexts.part1Task4Lead
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part1Task4Lead,
      part1Criteria:
        typeof variantTexts.part1Criteria === 'string'
          ? variantTexts.part1Criteria
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part1Criteria,
      part1Task5Lead:
        typeof variantTexts.part1Task5Lead === 'string'
          ? variantTexts.part1Task5Lead
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part1Task5Lead,
      part2Intro:
        typeof variantTexts.part2Intro === 'string'
          ? variantTexts.part2Intro
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part2Intro,
      part2QuestionsIntro:
        typeof variantTexts.part2QuestionsIntro === 'string'
          ? variantTexts.part2QuestionsIntro
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part2QuestionsIntro,
      part2Task9Lead:
        typeof variantTexts.part2Task9Lead === 'string'
          ? variantTexts.part2Task9Lead
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part2Task9Lead,
      part2Task9Criteria:
        typeof variantTexts.part2Task9Criteria === 'string'
          ? variantTexts.part2Task9Criteria
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part2Task9Criteria,
      part2Task10Lead:
        typeof variantTexts.part2Task10Lead === 'string'
          ? variantTexts.part2Task10Lead
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part2Task10Lead,
      part3Intro:
        typeof variantTexts.part3Intro === 'string'
          ? variantTexts.part3Intro
          : DEFAULT_KNOWLEDGE_BASE_SETTINGS.variantTexts.part3Intro,
    },
    weeklyVariant: source.weeklyVariant || null,
    weeklyPins:
      source.weeklyPins &&
      typeof source.weeklyPins === 'object' &&
      !Array.isArray(source.weeklyPins)
        ? (source.weeklyPins as Record<string, string>)
        : undefined,
  };
};

const normalizeBlock3 = (value: unknown): Block3Data => {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_BLOCK3 };
  }

  const source = value as Partial<Block3Data>;
  return {
    task11_1: Array.isArray(source.task11_1) ? source.task11_1 : [],
    task11_2_3: Array.isArray(source.task11_2_3) ? source.task11_2_3 : [],
    task11_4: Array.isArray(source.task11_4) ? source.task11_4 : [],
    task11_5: Array.isArray(source.task11_5) ? source.task11_5 : [],
  };
};

const normalizeKnowledgeBasePayload = (
  value: unknown,
): KnowledgeBasePayload => {
  const normalizedSource = normalizeNbspDeep(value);
  if (!normalizedSource || typeof normalizedSource !== 'object') {
    return {
      works: [],
      poets: [],
      block3: { ...EMPTY_BLOCK3 },
      settings: DEFAULT_KNOWLEDGE_BASE_SETTINGS,
    };
  }

  const source = normalizedSource as Partial<KnowledgeBasePayload>;

  return {
    works: Array.isArray(source.works) ? source.works : [],
    poets: Array.isArray(source.poets) ? source.poets : [],
    block3: normalizeBlock3(source.block3),
    settings: normalizeSettings(source.settings),
  };
};

const resolveApiUrl = () => {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000';
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const parseResponse = async (
  response: Response,
): Promise<KnowledgeBaseResponse> => {
  if (!response.ok) {
    const fallbackMessage = `HTTP ${response.status}`;
    const errorText = await response.text().catch(() => '');
    const detail = errorText || fallbackMessage;
    throw new Error(`Не удалось получить базу знаний (${detail})`);
  }

  const payload = await response.json();
  const normalized = normalizeKnowledgeBasePayload(payload);
  const updatedAt =
    typeof payload?.updatedAt === 'string' ? payload.updatedAt : null;

  return {
    ...normalized,
    updatedAt,
  };
};

export const fetchKnowledgeBase = async (): Promise<KnowledgeBaseResponse> => {
  const response = await fetch(`${resolveApiUrl()}/api/knowledge-base`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseResponse(response);
};

export const updateKnowledgeBase = async (
  payload: KnowledgeBasePayload,
): Promise<KnowledgeBaseResponse> => {
  const response = await fetch(`${resolveApiUrl()}/api/knowledge-base`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(normalizeKnowledgeBasePayload(payload)),
  });

  return parseResponse(response);
};

export const saveWeeklyPins = async (
  weeklyPins: Record<string, string> | null,
): Promise<void> => {
  const response = await fetch(
    `${resolveApiUrl()}/api/knowledge-base/weekly-pins`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ weeklyPins }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `HTTP ${response.status}`);
  }
};

export const setWeeklyVariant = async (
  weeklyVariant: unknown,
): Promise<void> => {
  const response = await fetch(
    `${resolveApiUrl()}/api/knowledge-base/weekly-variant`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ weeklyVariant }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `HTTP ${response.status}`);
  }
};
