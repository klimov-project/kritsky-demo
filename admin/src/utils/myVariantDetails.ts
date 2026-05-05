import type { MatchingQuestion } from '@/mocks/materials';
import {
    MY_VARIANT_DETAILS_HTML_TAG_PATTERN,
    MY_VARIANT_DETAILS_RUSSIAN_LETTERS,
    MY_VARIANT_DETAILS_TASK8_MAX_OPTIONS,
} from '@/consts/utils/myVariantDetails';
import type { SavedVariantRecord, Task1Filters } from '@/types/testVariant';

export { MY_VARIANT_DETAILS_RUSSIAN_LETTERS, MY_VARIANT_DETAILS_TASK8_MAX_OPTIONS };

export const formatMyVariantDate = (value: string): string => {
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

export const hasMyVariantDetailsHtmlMarkup = (value: string): boolean => MY_VARIANT_DETAILS_HTML_TAG_PATTERN.test(value);

export const getMyVariantTask2RightOptions = (question: MatchingQuestion | null): string[] => {
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

export const resolveVariantIdFromParams = (id: string | string[] | undefined): string => {
    if (!id) return '';
    return Array.isArray(id) ? id[0] : id;
};

export const getTask1FiltersLabel = (filters: Task1Filters): string => {
    return `${filters.includeWorkQuestions ? 'произведение' : ''}${filters.includeWorkQuestions && filters.includeTermQuestions ? ' + ' : ''}${filters.includeTermQuestions ? 'термины' : ''}`;
};

export const getVariantQuotaCaption = (savedVariantQuota: {
    dailyFreeRemaining: number;
    dailyFreeLimit: number;
    paidDownloadsRemaining: number;
}): string => {
    return `Бесплатных на сегодня: ${savedVariantQuota.dailyFreeRemaining} из ${savedVariantQuota.dailyFreeLimit}. Платных в запасе: ${savedVariantQuota.paidDownloadsRemaining}.`;
};

export const downloadSavedVariantAsJson = (savedVariant: SavedVariantRecord): void => {
    const blob = new Blob([JSON.stringify(savedVariant.variant, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `saved-variant-${savedVariant.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
};
