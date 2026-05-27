export type Id = string;

export interface Work {
  id: string;
  age18: boolean;
  title: string;
  author: string;
  workId: string;
  authorId: string;
  externalTags: string;
  internalTags: string;
  exercisesCount: {
    task1: number;
    task2: number;
    task3: number;
  };
  excerptsCount: number;
}

export interface VariantTextsSettings {
  part1Intro: string;
  part1QuestionsIntro: string;
  part1Task4Lead: string;
  part1Criteria: string;
  part1Task5Lead: string;
  part2Intro: string;
  part2QuestionsIntro: string;
  part2Task9Lead: string;
  part2Task9Criteria: string;
  part2Task10Lead: string;
  part3Intro: string;
}

export interface KnowledgeBaseSettings {
  variantTexts: VariantTextsSettings;
  weeklyVariant: any;
  weeklyPins?: Record<string, string>;
}

export interface ShortQuestion {
  id: Id;
  text: string;
  answer?: string;
  termId?: string;
  authorId?: string;
  tags?: string;
  isTermQuestion?: boolean;
  isActive?: boolean;
}

export interface TwoGapQuestion {
  id: Id;
  part1: string;
  part2: string;
  answer1: string;
  answer2: string;
  termId1?: string;
  termId2?: string;
  tags?: string;
  withoutAuthor?: boolean;
  isActive?: boolean;
}

export interface MatchPair {
  id: Id;
  character: string;
  tag?: string;
  properties: string[];
  propertyIds?: string[];
  phrases?: string[];
  characteristics?: string[];
}

export interface MatchingQuestion {
  id: Id;
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  pairs: MatchPair[];
  extraOption?: string;
  shuffledRightOptions?: string[];
  shuffledRightOptionIds?: string[];
  termId?: string;
  authorId?: string;
  characterCount?: number;
  characterSource?: 'quotes' | 'facts' | 'mixed';
  pairPropertyType?: 'phrases' | 'characteristics';
  tags?: string;
  isActive?: boolean;
}

export interface Character {
  id: Id;
  name: string;
  tag?: string;
  quotes: string[];
  facts: string[];
}

export interface PoemTasks {
  task6: TwoGapQuestion[];
  task7: ShortQuestion[];
  task8: ShortQuestion[];
  task9_1: MatchingQuestion[];
  task9_2: MatchingQuestion[];
  task10: EssayQuestion[];
}

export interface Poem {
  id: Id;
  title: string;
  poemId: string;
  text: string;
  textColumns?: 1 | 2;
  textSecondColumn?: string;
  age18: boolean;
  tasks: PoemTasks;
}

export interface Poet {
  id: Id;
  name: string;
  authorId: string;
  poems: Poem[];
}

export interface EssayQuestion {
  id: Id;
  text: string;
  termId?: string;
  authorId?: string;
  theme1Id?: string;
  theme2Id?: string;
  similarityId?: string;
  themeInternalId?: string;
  publicId?: string;
  tags?: string;
  isActive?: boolean;
}

export interface ExcerptTasks {
  excludeTask1Ids: Id[];
  excludeTask1TermIds: Id[];
  excludeTask2Ids: Id[];
  excludeTask2TermIds: Id[];
  excludeTask2Characters: string[];
  excludeTask2Properties: string[];
  excludeTask3Ids: Id[];
  excludeTask3TermIds: Id[];
  customTask1: ShortQuestion[];
  customTask2: MatchingQuestion[];
  customTask3: TwoGapQuestion[];
  task4_1: EssayQuestion[];
  task4_2: EssayQuestion[];
  task5: EssayQuestion[];
}

export interface Excerpt {
  id: Id;
  order: number;
  title: string;
  chapter?: string;
  excerptId: string;
  text: string;
  textColumns?: 1 | 2;
  textSecondColumn?: string;
  themeInternalId?: string;
  isActive?: boolean;
  tasks: ExcerptTasks;
}

export interface Work {
  id: Id;
  title: string;
  author: string;
  authorId: string;
  workId: string;
  age18: boolean;
  internalTags: string;
  externalTags: string;
  commonTasks: {
    task1: ShortQuestion[];
    task2: MatchingQuestion[];
    task3: TwoGapQuestion[];
  };
  characters: Character[];
  excerpts: Excerpt[];
}

export interface MultiSelectOption {
  id: Id;
  term: string;
  termId?: string;
  isCorrect?: boolean;
}

export interface MultiSelectQuestion {
  id: Id;
  prompt: string;
  options: MultiSelectOption[];
  termId?: string;
  tags?: string;
  isActive?: boolean;
}

export interface Poem {
  id: Id;
  title: string;
  poemId: string;
  text: string;
  textColumns?: 1 | 2;
  textSecondColumn?: string;
  age18: boolean;
  themeInternalId?: string;
  isActive?: boolean;
  tasks: PoemTasks;
}

export interface Poet {
  id: Id;
  name: string;
  authorId: string;
  poems: Poem[];
}

export interface Block3Question {
  id: Id;
  text: string;
  workId?: string;
  authorId?: string;
  termId?: string;
  rodId?: string;
  questionId?: string;
  special?: boolean;
  themeInternalId?: string;
  publicId?: string;
  tags?: string;
  isActive?: boolean;
}

export interface Block3QuestionMultiAuthor {
  id: Id;
  text: string;
  termId?: string;
  rodId?: string;
  authorIds: string[];
  themeInternalId?: string;
  publicId?: string;
  tags?: string;
  isActive?: boolean;
}

export interface Block3Data {
  task11_1: Block3Question[];
  task11_2_3: Block3Question[];
  task11_4: Block3QuestionMultiAuthor[];
  task11_5: Block3Question[];
}

export interface ThemeOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface KnowledgeBaseNitroResponse extends KnowledgeBasePayload {
  works?: Work[];
  poets?: Poet[];
  block3?: Block3Data;
  _metadata?: {
    hash: string;
    fetchedAt: string;
    computed: {
      variantsCount: number;
      poetsCount: number;
      totalEntities: number;
    };
  };
}

export interface KnowledgeBasePayload extends KnowledgeBaseResponse {
  poems?: Poem[];
  themes?: ThemeOption[];
  stats?: Record<string, any>;
  _metadata?: {
    hash: string;
    fetchedAt: string;
    computed: {
      variantsCount: number;
      poetsCount: number;
      totalEntities: number;
    };
  };
}

export interface KnowledgeBaseResponseRaw {
  works?: Work[];
  poets?: Poet[];
  block3?: Block3Data;
  settings: KnowledgeBaseSettings;
  updatedAt: Date;
}

export interface KnowledgeBaseResponse extends KnowledgeBaseResponseRaw {
  _metadata?: {
    hash: string;
    fetchedAt: string;
    computed: {
      variantsCount: number;
      poetsCount: number;
      totalEntities: number;
    };
  };
}
