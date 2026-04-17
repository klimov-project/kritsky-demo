import type { MatchingQuestion } from '@/mocks/materials';
import {
    MY_VARIANTS_HTML_TAG_PATTERN,
    MY_VARIANTS_RUSSIAN_LETTERS,
    MY_VARIANTS_TASK8_MAX_OPTIONS,
} from '@/consts/utils/myVariants';
import type { MyVariantsSavedRecord } from '@/types/api/myVariants';

export { MY_VARIANTS_RUSSIAN_LETTERS, MY_VARIANTS_TASK8_MAX_OPTIONS };

export const formatMyVariantsDate = (value: string): string => {
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

export const hasMyVariantsHtmlMarkup = (value: string): boolean => MY_VARIANTS_HTML_TAG_PATTERN.test(value);

export const getMyVariantsTask2RightOptions = (question: MatchingQuestion | null): string[] => {
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

export const sortMyVariantsByDateDesc = (variants: MyVariantsSavedRecord[]): MyVariantsSavedRecord[] => {
    return [...variants].sort((left, right) => (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ));
};
