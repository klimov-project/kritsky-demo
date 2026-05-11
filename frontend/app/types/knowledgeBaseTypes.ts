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
