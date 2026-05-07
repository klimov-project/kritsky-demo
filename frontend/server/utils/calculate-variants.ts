// interface KnowledgeBase {
//   works: Work[];
// }

// interface Work {
//   commonTasks: {
//     task1: Task[];
//     task2: Task2[];
//     task3?: Task3[];
//     task4?: Task4[];
//     task5?: Task5[];
//   };
//   excerpts: Excerpt[];
// }

export function calculateTotalVariants(kb: any): number {
  let total = 0;

  for (const work of kb.works) {
    for (const excerpt of work.excerpts) {
      // 1. Количество доступных заданий Блока 1
      const generalTask1 = work.commonTasks.task1 || [];
      const excludeIdsTask1 = new Set(excerpt.tasks?.excludeTask1Ids || []);
      const customTask1 = excerpt.tasks?.customTask1 || [];
      const availableTask1 = generalTask1.filter(
        (t) => !excludeIdsTask1.has(t.id),
      );
      const countTask1 = availableTask1.length + customTask1.length;
      if (countTask1 === 0) continue;

      // 2. Количество доступных заданий Блока 2 с учётом исключений
      const countTask2Variants = calculateBlock2Variants(work, excerpt);

      // 3-5. Остальные блоки с примерной оценкой
      const countTask3Variants = estimateBlockVariants(
        work.commonTasks.task3,
        100,
      );
      const countTask4Variants = estimateBlockVariants(
        work.commonTasks.task4,
        50,
      );
      const countTask5Variants = estimateBlockVariants(
        work.commonTasks.task5,
        25,
      );

      const excerptVariants =
        countTask1 *
        countTask2Variants *
        countTask3Variants *
        countTask4Variants *
        countTask5Variants;
      total += excerptVariants;
    }
  }

  return total;
}

function calculateBlock2Variants(work: Work, excerpt: Excerpt): number {
  const generalTask2 = work.commonTasks.task2 || [];
  const excludeIdsTask2 = new Set(excerpt.tasks?.excludeTask2Ids || []);
  const excludeCharacters = new Set(
    excerpt.tasks?.excludeTask2Characters || [],
  );

  let countTask2Variants = 0;

  for (const task of generalTask2) {
    if (excludeIdsTask2.has(task.id)) continue;

    const validPairs =
      task.pairs?.filter((p) => !excludeCharacters.has(p.id)) || [];
    const slots = task.characterCount || 0;

    if (validPairs.length >= slots && slots > 0) {
      countTask2Variants += permutations(validPairs.length, slots);
    }
  }

  return countTask2Variants || 1; // Минимум 1, чтобы не обнулить общее произведение
}

function estimateBlockVariants(
  tasks: any[] | undefined,
  averageMultiplier: number,
): number {
  if (!tasks || tasks.length === 0) return 1;

  // Примерная оценка: количество заданий * средний множитель
  // Это даёт реалистичную оценку порядка без точного подсчёта всех комбинаций
  return Math.max(1, tasks.length * averageMultiplier);
}

function permutations(n: number, k: number): number {
  if (k > n || k <= 0) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= n - i;
  }
  return result;
}
