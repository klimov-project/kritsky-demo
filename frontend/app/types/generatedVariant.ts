import type {
  Block3Question,
  Block3QuestionMultiAuthor,
  EssayQuestion,
  Excerpt,
  MatchingQuestion,
  MultiSelectOption,
  MultiSelectQuestion,
  Poem,
  Poet,
  ShortQuestion,
  TwoGapQuestion,
  Work,
} from '@/types/knowledgeBaseTypes';

export interface GeneratedVariant {
  work: Work;
  excerpt: Excerpt;
  task1: ShortQuestion | null;
  task2: MatchingQuestion | null;
  task3: TwoGapQuestion | null;
  task4_1: EssayQuestion | null;
  task4_2: EssayQuestion | null;
  task5: EssayQuestion | null;
  poet: Poet;
  poem: Poem;
  task6: TwoGapQuestion | null;
  task7: ShortQuestion | null;
  task8: MultiSelectQuestion | null;
  task8Options: MultiSelectOption[];
  task9_1: EssayQuestion | null;
  task9_2: EssayQuestion | null;
  task10: EssayQuestion | null;
  task11_1: Block3Question | null;
  task11_2: Block3Question | null;
  task11_3: Block3Question | null;
  task11_4: Block3QuestionMultiAuthor | null;
  task11_5: Block3Question | null;
}

export interface Task1Filters {
  includeWorkQuestions: boolean;
  includeTermQuestions: boolean;
}

export interface SavedVariantSettings {
  selectedWorkId: string;
  selectedWorkLabel: string;
  selectedExcerptId: string;
  selectedExcerptLabel: string;
  selectedPoetId: string;
  selectedPoetLabel: string;
  selectedPoemId: string;
  selectedPoemLabel: string;
  selectedThemeId: string;
  selectedBlock3AuthorId: string;
  selectedBlock3AuthorLabel: string;
  task1Filters: Task1Filters;
}

export interface SavedVariantRecord {
  id: string | number;
  userId?: number;
  createdAt: string;
  variant: GeneratedVariant;
  settings: SavedVariantSettings;
}
