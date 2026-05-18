interface Work {
  commonTasks: {
    task1: Task1[];
    task2: Task2[];
    task3?: Task3[];
    task4_1?: Task4[];
    task4_2?: Task4[];
    task5?: Task5[];
    task6?: Task6[]; // Добавлен task6
  };
  excerpts: Excerpt[];
}

// Вспомогательная функция для расчета вариантов в одном задании Task2
function calculateSingleTask2Variants(task: Task2, excerpt: Excerpt): number {
  let totalVariants = 0;

  const slots = task.characterCount || task.pairs?.length || 0;
  if (slots <= 0) return 0;

  const excludeCharacters = new Set(
    excerpt.tasks?.excludeTask2Characters || [],
  );
  const excludeProperties = new Set(
    excerpt.tasks?.excludeTask2Properties || [],
  );

  // 1. Фильтруем персонажей (pairs) для этого задания
  const validPairs =
    task.pairs?.filter((pair) => !excludeCharacters.has(pair.id)) || [];

  // 2. Для каждого валидного персонажа считаем количество его валидных свойств
  const pairsWithValidPropertyCount = validPairs
    .map((pair) => {
      // Свойства персонажа могут быть в `characteristics` или `phrases`
      const allProperties = pair.characteristics || pair.phrases || [];
      const validPropertiesCount = allProperties.filter(
        (prop) => !excludeProperties.has(prop),
      ).length;

      return {
        pair,
        validPropertiesCount: validPropertiesCount,
      };
    })
    .filter((item) => item.validPropertiesCount > 0); // Убираем персонажей без доступных свойств

  const n = pairsWithValidPropertyCount.length;

  // 3. Генерируем все возможные комбинации выбора K персонажей из N
  // Для этого нет встроенной функции, поэтому реализуем рекурсивный подсчет
  function generateAndCount(
    startIndex: number,
    currentK: number,
    currentPropertiesProduct: number,
  ): void {
    if (currentK === slots) {
      totalVariants += currentPropertiesProduct;
      return;
    }
    // Осталось персонажей: (n - startIndex)
    // Нужно выбрать: (slots - currentK)
    if (n - startIndex < slots - currentK) {
      return; // Не хватает персонажей для выбора
    }

    for (let i = startIndex; i < n; i++) {
      const pair = pairsWithValidPropertyCount[i];
      // Количество валидных свойств у текущего персонажа
      const variantsForThisPair = pair.validPropertiesCount;

      // Рекурсивно выбираем следующего персонажа
      generateAndCount(
        i + 1,
        currentK + 1,
        currentPropertiesProduct * variantsForThisPair,
      );
    }
  }

  generateAndCount(0, 0, 1);
  return totalVariants;
}

// --- Основные функции расчета ---

function calculateBlock1Variants(work: Work, excerpt: Excerpt): number {
  const generalTask1 = work.commonTasks.task1 || [];
  const excludeIds = new Set(excerpt.tasks?.excludeTask1Ids || []);
  const customTask1 = excerpt.tasks?.customTask1 || [];

  const availableGeneral = generalTask1.filter((t) => !excludeIds.has(t.id));
  return availableGeneral.length + customTask1.length;
}

function calculateBlock2Variants(work: Work, excerpt: Excerpt): number {
  const generalTask2 = work.commonTasks.task2 || [];
  const excludeIds = new Set(excerpt.tasks?.excludeTask2Ids || []);

  let totalVariants = 0;
  for (const task of generalTask2) {
    if (excludeIds.has(task.id)) continue;
    totalVariants += calculateSingleTask2Variants(task, excerpt);
  }
  return totalVariants || 1; // Хотя бы 1, чтобы не обнулить произведение
}

function calculateBlockVariants(
  generalTasks: any[] | undefined,
  excludeIds: Set<string>,
  customTasks: any[] | undefined,
): number {
  const availableGeneral =
    generalTasks?.filter((t) => !excludeIds.has(t.id)).length || 0;
  const availableCustom = customTasks?.length || 0;
  return availableGeneral + availableCustom || 1;
}

// Функция подсчёта вариаций на главной странице
export function calculateTotalVariants(kb: any): number {
  let total = 0;
  if (!kb.works) return 19999999999;

  for (const work of kb.works) {
    for (const excerpt of work.excerpts) {
      const excerptTasks = excerpt.tasks;

      // 1. Блок 1
      const countTask1 = calculateBlock1Variants(work, excerpt);
      if (countTask1 === 0) continue;

      // 2. Блок 2
      const countTask2 = calculateBlock2Variants(work, excerpt);

      // 3. Блок 3
      const excludeTask3Ids = new Set(excerptTasks?.excludeTask3Ids || []);
      const countTask3 = calculateBlockVariants(
        work.commonTasks.task3,
        excludeTask3Ids,
        excerptTasks?.customTask3,
      );

      // 4. Блок 4
      const excludeTask4Ids = new Set(excerptTasks?.excludeTask4Ids || []);
      const countTask4_1 = calculateBlockVariants(
        work.commonTasks.task4_1,
        excludeTask4Ids,
        excerptTasks?.customTask4_1,
      );
      const countTask4_2 = calculateBlockVariants(
        work.commonTasks.task4_2,
        excludeTask4Ids,
        excerptTasks?.customTask4_2,
      );

      // 5. Блок 5
      const excludeTask5Ids = new Set(excerptTasks?.excludeTask5Ids || []);
      const countTask5 = calculateBlockVariants(
        work.commonTasks.task5,
        excludeTask5Ids,
        excerptTasks?.customTask5,
      );

      // 6. Блок 6
      const excludeTask6Ids = new Set(excerptTasks?.excludeTask6Ids || []);
      const countTask6 = calculateBlockVariants(
        work.commonTasks.task6,
        excludeTask6Ids,
        excerptTasks?.customTask6,
      );

      const excerptVariants =
        countTask1 *
        countTask2 *
        countTask3 *
        countTask4_1 *
        countTask4_2 *
        countTask5 *
        countTask6;

      total += excerptVariants;
    }
  }

  return total;
}
