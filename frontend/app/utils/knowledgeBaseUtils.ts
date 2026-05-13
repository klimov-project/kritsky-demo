import { EMPTY_BLOCK3, DEFAULT_KNOWLEDGE_BASE_SETTINGS } from '@/utils/const';
import { filterActiveItems } from '@/utils/variant/create';
import type {
  KnowledgeBasePayload,
  ThemeOption,
} from '@/types/knowledgeBaseTypes';

import type {
  Block3Data,
  EssayQuestion,
  KnowledgeBaseSettings,
  Poem,
  Poet,
  VariantTextsSettings,
} from '@/types/knowledgeBaseTypes';

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

const buildThemeOptions = (poets: Poet[] = []): ThemeOption[] => {
  const theme1Set = new Set<string>();
  const theme2Set = new Set<string>();

  poets.forEach((poet) => {
    if (!Array.isArray(poet.poems)) return;

    poet.poems.forEach((poem: Poem) => {
      const task10 = Array.isArray(poem.tasks.task10)
        ? poem.tasks.task10
        : ([] as EssayQuestion[]);
      filterActiveItems<EssayQuestion>(task10).forEach((task) => {
        if (task.theme1Id) theme1Set.add(task.theme1Id);
        if (task.theme2Id) theme2Set.add(task.theme2Id);
      });
    });
  });

  const sortedTheme1 = Array.from(theme1Set).sort();
  const sortedTheme2 = Array.from(theme2Set).sort();
  const onlyTheme1 = sortedTheme1.filter((t) => !theme2Set.has(t));

  const options: ThemeOption[] = [];
  sortedTheme2.forEach((theme) => options.push({ value: theme, label: theme }));

  if (sortedTheme2.length > 0 && onlyTheme1.length > 0) {
    options.push({ value: '---', label: '──────────', disabled: true });
  }

  onlyTheme1.forEach((theme) => options.push({ value: theme, label: theme }));

  return options;
};

export const normalizeKnowledgeBasePayload = (
  value: unknown,
): KnowledgeBasePayload => {
  const normalizedSource = normalizeNbspDeep(value);
  if (!normalizedSource || typeof normalizedSource !== 'object') {
    return {
      works: [],
      poets: [],
      poems: [],
      themes: [],
      block3: { ...EMPTY_BLOCK3 },
      settings: DEFAULT_KNOWLEDGE_BASE_SETTINGS,
      stats: {},
    };
  }

  const source = normalizedSource as Partial<KnowledgeBasePayload>;
  const poets = Array.isArray(source.poets) ? source.poets : [];

  return {
    works: Array.isArray(source.works) ? source.works : [],
    poets,
    poems: poets.flatMap((poet) =>
      Array.isArray(poet.poems) ? poet.poems : [],
    ),
    themes: buildThemeOptions(poets),
    block3: normalizeBlock3(source.block3),
    settings: normalizeSettings(source.settings),
    stats: source.stats ?? {},
    _metadata: source._metadata,
  };
};
