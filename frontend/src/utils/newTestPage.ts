import { sortExcerptsByOrder } from '@/utils/newTest';
import type {
    NewTestAdminTaskMetaTask,
    NewTestWorkWithExcerpts,
} from '@/types/ui/newTestPage';

export const getExcerptChapters = (work: NewTestWorkWithExcerpts): string[] => {
    const sorted = sortExcerptsByOrder(work.excerpts);
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (const excerpt of sorted) {
        const chapter = excerpt.chapter?.trim();
        if (chapter && !seen.has(chapter)) {
            seen.add(chapter);
            ordered.push(chapter);
        }
    }

    return ordered;
};

export const getTextColumnsCount = (value: unknown): 1 | 2 => (Number(value) === 2 ? 2 : 1);

export const getRodLabel = (rodId?: string): string | null => {
    if (!rodId) return null;
    const normalized = rodId.toLowerCase();
    if (normalized.includes('лирик')) return 'лирика';
    if (normalized.includes('пьес')) return 'пьеса';
    if (normalized.includes('поэм')) return 'поэма';
    if (normalized.includes('проз')) return 'проза';
    return rodId;
};

export const getTagsList = (task: NewTestAdminTaskMetaTask | null | undefined): string[] => {
    if (!task) return [];

    const raw = task.tags ?? task.tag;
    if (!raw) return [];

    if (typeof raw === 'string') {
        return raw
            .split(/[,\n;]+/u)
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
