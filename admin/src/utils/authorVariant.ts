import type { VariantExportQuota } from '@/lib/variantsApi';
import {
    AUTHOR_VARIANT_HTML_TAG_PATTERN,
    AUTHOR_VARIANT_RUSSIAN_LETTERS,
    AUTHOR_VARIANT_SUPPORT_EMAIL,
    AUTHOR_VARIANT_TASK8_MAX_OPTIONS,
} from '@/consts/utils/authorVariant';
import type { Block3Data, Excerpt, KnowledgeBaseSettings, MatchingQuestion, Poet, Work } from '@/mocks/materials';
import type { ActivatableEntry, AuthorVariantFeedbackPayload, AuthorVariantUser } from '@/types/api/authorVariant';
import type { GeneratedVariant } from '@/types/testVariant';

export {
    AUTHOR_VARIANT_RUSSIAN_LETTERS,
    AUTHOR_VARIANT_TASK8_MAX_OPTIONS,
    AUTHOR_VARIANT_SUPPORT_EMAIL,
};

export const sortExcerptsByOrder = (excerpts: Excerpt[]): Excerpt[] => {
    return [...excerpts].sort((left, right) => left.order - right.order);
};

export const filterActiveItems = <T extends ActivatableEntry,>(items: T[]): T[] => {
    return items.filter((item) => item.isActive !== false);
};

export const getTask2RightOptions = (question: MatchingQuestion | null): string[] => {
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

export const hasHtmlMarkup = (value: string): boolean => AUTHOR_VARIANT_HTML_TAG_PATTERN.test(value);

export const buildAuthorVariant = (
    works: Work[],
    poets: Poet[],
    block3: Block3Data,
): GeneratedVariant | null => {
    const work = works[0] || null;
    const excerpt = work ? sortExcerptsByOrder(work.excerpts)[0] || null : null;
    const poet = poets[0] || null;
    const poem = poet?.poems[0] || null;

    if (!work || !excerpt || !poet || !poem) {
        return null;
    }

    const task1Pool = [
        ...filterActiveItems(work.commonTasks.task1).filter((q) => !excerpt.tasks.excludeTask1Ids.includes(q.id)),
        ...filterActiveItems(excerpt.tasks.customTask1),
    ];
    const task2Pool = [
        ...filterActiveItems(work.commonTasks.task2).filter((q) => !excerpt.tasks.excludeTask2Ids.includes(q.id)),
        ...filterActiveItems(excerpt.tasks.customTask2),
    ];
    const task3Pool = [
        ...filterActiveItems(work.commonTasks.task3).filter((q) => !excerpt.tasks.excludeTask3Ids.includes(q.id)),
        ...filterActiveItems(excerpt.tasks.customTask3),
    ];
    const task11_2_3 = filterActiveItems(block3.task11_2_3);
    const task8 = filterActiveItems(poem.tasks.task8)[0] || null;

    return {
        work,
        excerpt,
        task1: task1Pool[0] || null,
        task2: task2Pool[0] || null,
        task3: task3Pool[0] || null,
        task4_1: filterActiveItems(excerpt.tasks.task4_1)[0] || null,
        task4_2: filterActiveItems(excerpt.tasks.task4_2)[0] || null,
        task5: filterActiveItems(excerpt.tasks.task5)[0] || null,
        poet,
        poem,
        task6: filterActiveItems(poem.tasks.task6)[0] || null,
        task7: filterActiveItems(poem.tasks.task7)[0] || null,
        task8,
        task8Options: (task8?.options || []).slice(0, AUTHOR_VARIANT_TASK8_MAX_OPTIONS),
        task9_1: filterActiveItems(poem.tasks.task9_1)[0] || null,
        task9_2: filterActiveItems(poem.tasks.task9_2)[0] || null,
        task10: filterActiveItems(poem.tasks.task10)[0] || null,
        task11_1: filterActiveItems(block3.task11_1)[0] || null,
        task11_2: task11_2_3[0] || null,
        task11_3: task11_2_3[1] || task11_2_3[0] || null,
        task11_4: filterActiveItems(block3.task11_4)[0] || null,
        task11_5: filterActiveItems(block3.task11_5)[0] || null,
    };
};

export const getAuthorVariantQuotaCaption = (
    user: AuthorVariantUser,
    exportQuota: VariantExportQuota | null,
): string => {
    if (!user) {
        return 'Для скачивания и печати войдите в аккаунт.';
    }
    if (user.role === 'admin') {
        return 'Доступ к скачиваниям и печати безлимитный (админ).';
    }
    if (!exportQuota) {
        return 'Не удалось загрузить квоту скачиваний.';
    }
    return `Бесплатных на сегодня: ${exportQuota.dailyFreeRemaining} из ${exportQuota.dailyFreeLimit}. Платных в запасе: ${exportQuota.paidDownloadsRemaining}.`;
};

export const buildAuthorVariantFeedbackBody = (payload: AuthorVariantFeedbackPayload): string => {
    return [
        payload.name ? `Имя: ${payload.name}` : '',
        payload.email ? `Email: ${payload.email}` : '',
        '',
        payload.comment.trim(),
    ].filter(Boolean).join('\n');
};

export const getTask8AnswerLabel = (variant: GeneratedVariant): string => {
    return variant.task8Options
        .map((option, index) => (option.isCorrect ? String(index + 1) : null))
        .filter(Boolean)
        .join(', ') || '—';
};

export const buildAuthorVariantPdfFileName = (variant: GeneratedVariant): string => {
    return `Вариант от автора - ${variant.work.title} - ${variant.poem.title}.pdf`;
};

export const resolveAuthorVariantFromKnowledgeBase = (
    settings: KnowledgeBaseSettings,
    works: Work[],
    poets: Poet[],
    block3: Block3Data,
): GeneratedVariant | null => {
    if (settings.weeklyVariant) {
        return settings.weeklyVariant;
    }

    if (works.length > 0 && poets.length > 0) {
        return buildAuthorVariant(works, poets, block3);
    }

    return null;
};
