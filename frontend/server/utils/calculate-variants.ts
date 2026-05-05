export function calculateTotalVariants(kb: any): number {
  let total = 0;

  for (const work of kb.works) {
    for (const excerpt of work.excerpts) {
      // 1. Количество доступных заданий Блока 1
      const generalTask1 = work.commonTasks.task1;
      const excludeIdsTask1 = new Set(excerpt.tasks.excludeTask1Ids);
      const customTask1 = excerpt.tasks.customTask1 || [];
      const availableTask1 = generalTask1.filter(
        (t) => !excludeIdsTask1.has(t.id),
      );
      const countTask1 = availableTask1.length + customTask1.length;
      if (countTask1 === 0) continue;

      // 2. Количество доступных заданий Блока 2 с учётом исключений
      const generalTask2 = work.commonTasks.task2;
      const excludeIdsTask2 = new Set(excerpt.tasks.excludeTask2Ids);
      const excludeCharacters = new Set(excerpt.tasks.excludeTask2Characters);

      let countTask2Variants = 0;
      for (const task of generalTask2) {
        if (excludeIdsTask2.has(task.id)) continue;
        const validPairs = task.pairs.filter((p) => {
          if (excludeCharacters.has(p.id)) return false;
          // тут можно учесть excludeTask2Properties
          return true;
        });
        // Количество комбинаций при сопоставлении (размещения)
        const slots = task.characterCount || 0;
        if (validPairs.length >= slots) {
          countTask2Variants += permutations(validPairs.length, slots);
        }
      }

      // 3. Аналогично Блоки 3,4,5...
      // ...

      // Для простоты предположим, что остальные блоки пока константа 1
      const excerptVariants = countTask1 * countTask2Variants;
      total += excerptVariants;
    }
  }

  return total;
}

function permutations(n: number, k: number): number {
  if (k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result *= n - i;
  return result;
}
