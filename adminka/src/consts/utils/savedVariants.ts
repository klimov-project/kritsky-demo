import type { Task1Filters } from '@/types/testVariant';

export const SAVED_TEST_VARIANTS_STORAGE_KEY = 'saved-test-variants';
export const EXPORT_USAGE_STORAGE_KEY = 'test-export-usage';
export const EXPORT_DAILY_LIMIT = 20;

export const DEFAULT_TASK1_FILTERS: Task1Filters = {
    includeWorkQuestions: true,
    includeTermQuestions: true,
};
