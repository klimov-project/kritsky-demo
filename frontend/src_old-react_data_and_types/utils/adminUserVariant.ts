import type { MatchingQuestion } from '@/mocks/materials';
import {
    ADMIN_USER_VARIANT_HTML_TAG_PATTERN,
    ADMIN_USER_VARIANT_RUSSIAN_LETTERS,
    ADMIN_USER_VARIANT_TASK8_MAX_OPTIONS,
} from '@/consts/utils/adminUserVariant';
import type {
    AdminUserVariantTaskWithTags,
    AdminUserVariantTaskTwo,
} from '@/types/ui/adminUserVariant';

export { ADMIN_USER_VARIANT_RUSSIAN_LETTERS, ADMIN_USER_VARIANT_TASK8_MAX_OPTIONS };

export const hasHtmlMarkup = (value: string): boolean => ADMIN_USER_VARIANT_HTML_TAG_PATTERN.test(value);

export const formatAdminUserVariantDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

export const getTask2RightOptions = (question: AdminUserVariantTaskTwo): string[] => {
    if (!question) return [];
    if (question.shuffledRightOptions) return question.shuffledRightOptions;

    const options = question.pairs
        .map((pair) => pair.properties.find((property) => property.trim())?.trim() || '')
        .filter(Boolean);

    if (question.extraOption?.trim()) {
        options.push(question.extraOption.trim());
    }

    return options;
};

export const getRodLabel = (rodId?: string): string | null => {
    if (!rodId) return null;

    const normalized = rodId.toLowerCase();
    if (normalized.includes('лирик')) return 'лирика';
    if (normalized.includes('пьес')) return 'пьеса';
    if (normalized.includes('поэм')) return 'поэма';
    if (normalized.includes('проз')) return 'проза';

    return rodId;
};

export const getTaskTagsList = (task: AdminUserVariantTaskWithTags): string[] => {
    if (!task) return [];

    const raw = task.tags ?? task.tag;
    if (!raw) return [];

    if (typeof raw === 'string') {
        return raw
            .split(/[\n,;]+/)
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    if (Array.isArray(raw)) {
        return raw
            .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
            .map((tag) => tag.trim());
    }

    return [];
};

export const getAdminUserVariantErrorMessage = (errorValue: unknown): string => {
    if (errorValue instanceof Error && errorValue.message) {
        return errorValue.message;
    }
    return 'Ошибка загрузки варианта';
};
