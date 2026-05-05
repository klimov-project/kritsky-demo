import type { GeneratedVariant } from '@/types/testVariant';
import type { RuntimeVariantBlockKey } from '@/lib/variantsApi';

export type Task2PropertyCategory = 'phrases' | 'characteristics';

export type Task2RuntimeExclusions = {
    characters: Set<string>;
    properties: Set<string>;
};

export type VariantTaskKey =
    | 'task1'
    | 'task2'
    | 'task3'
    | 'task4_1'
    | 'task4_2'
    | 'task5'
    | 'task6'
    | 'task7'
    | 'task8'
    | 'task9_1'
    | 'task9_2'
    | 'task10'
    | 'task11_1'
    | 'task11_2'
    | 'task11_3'
    | 'task11_4'
    | 'task11_5';

export type TaskVariantHistory = Record<VariantTaskKey, GeneratedVariant[]>;

export type CycleHistory = Record<VariantTaskKey, string[]>;

export type TaskBooleanFlags = Record<VariantTaskKey, boolean>;

export type BlockBooleanFlags = Record<RuntimeVariantBlockKey, boolean>;

export type VariantTaskEntry = {
    key: VariantTaskKey;
    value: GeneratedVariant[VariantTaskKey];
    fallbackAuthorId?: string;
};

export type ActivatableEntry = {
    isActive?: boolean;
};
