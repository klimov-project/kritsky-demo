import {
    DEFAULT_TASK1_FILTERS,
    EXPORT_DAILY_LIMIT,
    EXPORT_USAGE_STORAGE_KEY,
    SAVED_TEST_VARIANTS_STORAGE_KEY,
} from '@/consts/utils/savedVariants';
import type {
    GeneratedVariant,
    SavedVariantRecord,
    SavedVariantSettings,
    Task1Filters,
} from '@/types/testVariant';

export {
    SAVED_TEST_VARIANTS_STORAGE_KEY,
    EXPORT_USAGE_STORAGE_KEY,
    EXPORT_DAILY_LIMIT,
    DEFAULT_TASK1_FILTERS,
};

interface SaveRecordInput {
    variant: GeneratedVariant;
    settings: SavedVariantSettings;
}

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const toStringOrFallback = (value: unknown, fallback = '') => {
    return typeof value === 'string' ? value : fallback;
};

const toTask1Filters = (value: unknown): Task1Filters => {
    if (!isObject(value)) {
        return DEFAULT_TASK1_FILTERS;
    }

    return {
        includeWorkQuestions: typeof value.includeWorkQuestions === 'boolean'
            ? value.includeWorkQuestions
            : DEFAULT_TASK1_FILTERS.includeWorkQuestions,
        includeTermQuestions: typeof value.includeTermQuestions === 'boolean'
            ? value.includeTermQuestions
            : DEFAULT_TASK1_FILTERS.includeTermQuestions,
    };
};

const fallbackSettingsFromVariant = (variant: GeneratedVariant): SavedVariantSettings => {
    return {
        selectedWorkId: variant.work.id,
        selectedWorkLabel: `${variant.work.author} — ${variant.work.title}`,
        selectedExcerptId: variant.excerpt.id,
        selectedExcerptLabel: variant.excerpt.title,
        selectedPoetId: variant.poet.id,
        selectedPoetLabel: variant.poet.name,
        selectedPoemId: variant.poem.id,
        selectedPoemLabel: variant.poem.title,
        selectedThemeId: '',
        selectedBlock3AuthorId: '',
        selectedBlock3AuthorLabel: '',
        task1Filters: DEFAULT_TASK1_FILTERS,
    };
};

const toSettings = (value: unknown, variant: GeneratedVariant): SavedVariantSettings => {
    const fallback = fallbackSettingsFromVariant(variant);
    if (!isObject(value)) return fallback;

    return {
        selectedWorkId: toStringOrFallback(value.selectedWorkId, fallback.selectedWorkId),
        selectedWorkLabel: toStringOrFallback(value.selectedWorkLabel, fallback.selectedWorkLabel),
        selectedExcerptId: toStringOrFallback(value.selectedExcerptId, fallback.selectedExcerptId),
        selectedExcerptLabel: toStringOrFallback(value.selectedExcerptLabel, fallback.selectedExcerptLabel),
        selectedPoetId: toStringOrFallback(value.selectedPoetId, fallback.selectedPoetId),
        selectedPoetLabel: toStringOrFallback(value.selectedPoetLabel, fallback.selectedPoetLabel),
        selectedPoemId: toStringOrFallback(value.selectedPoemId, fallback.selectedPoemId),
        selectedPoemLabel: toStringOrFallback(value.selectedPoemLabel, fallback.selectedPoemLabel),
        selectedThemeId: toStringOrFallback(value.selectedThemeId, fallback.selectedThemeId),
        selectedBlock3AuthorId: toStringOrFallback(value.selectedBlock3AuthorId, fallback.selectedBlock3AuthorId),
        selectedBlock3AuthorLabel: toStringOrFallback(value.selectedBlock3AuthorLabel, fallback.selectedBlock3AuthorLabel),
        task1Filters: toTask1Filters(value.task1Filters),
    };
};

const normalizeSavedRecord = (value: unknown, index: number): SavedVariantRecord | null => {
    if (!isObject(value) || !isObject(value.variant)) return null;

    const variant = value.variant as unknown as GeneratedVariant;
    const createdAt = toStringOrFallback(value.createdAt, new Date().toISOString());
    const id = toStringOrFallback(value.id, `saved-${createdAt}-${index}`);
    const settings = toSettings(value.settings, variant);

    return {
        id,
        createdAt,
        variant,
        settings,
    };
};

export const parseSavedVariants = (raw: string | null): SavedVariantRecord[] => {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((item, index) => normalizeSavedRecord(item, index))
            .filter((item): item is SavedVariantRecord => Boolean(item));
    } catch {
        return [];
    }
};

export const createSavedVariantRecord = ({ variant, settings }: SaveRecordInput): SavedVariantRecord => {
    const timestamp = new Date().toISOString();

    return {
        id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: timestamp,
        variant,
        settings,
    };
};
