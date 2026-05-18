import type { GeneratedVariant } from './generatedVariant';

export type VariantTaskKey =
  | 'task1'
  | 'task2'
  | 'task3'
  | 'task4'
  | 'task5'
  | 'task6'
  | 'task7'
  | 'task8'
  | 'task9'
  | 'task10'
  | 'task11_1'
  | 'task11_2_3'
  | 'task11_4'
  | 'task11_5'
  | 'task12'
  | 'task13'
  | 'task14'
  | 'task15'
  | 'task16';

export type RuntimeVariantBlockKey = 'block1' | 'block2' | 'block3';

export type TaskVariantHistory = Record<string, GeneratedVariant[]>;
export type CycleHistory = Record<string, string[]>;

export interface TaskBooleanFlags {
  [key: string]: boolean;
}

export interface BlockBooleanFlags {
  block1: boolean;
  block2: boolean;
  block3: boolean;
}

export interface VariantExportQuota {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

export interface Task2RuntimeExclusions {
  characterNames: string[];
  propertyTexts: string[];
}

export type Task2PropertyCategory = 'phrases' | 'characteristics';
