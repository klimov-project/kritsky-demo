import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';

/**
 * Преобразует полный payload базы знаний в сокращённый формат,
 * извлекая 'works' и 'poets' в отдельные массивы.
 * Для отрывков сохраняются только метаданные (без текстов и заданий).
 *
 * @param rawPayload - Исходный JSON-объект с полными данными.
 * @returns Объект типа KnowledgeBasePayload с сокращёнными данными.
 */
export function transformToKnowledgeBasePayload(
  rawPayload: any,
): KnowledgeBasePayload {
  const works: Array<Record<string, any>> = [];
  const poetsMap = new Map<string, Record<string, any>>();

  if (Array.isArray(rawPayload.works)) {
    for (const work of rawPayload.works) {
      // 1. Обрабатываем отрывки (excerpts)
      const excerpts: Array<Record<string, any>> = [];
      if (Array.isArray(work.excerpts)) {
        for (const excerpt of work.excerpts) {
          // Извлекаем только метаданные, исключая полный текст и задания
          const {
            text, // Удаляем полный текст
            textSecondColumn, // Удаляем вторую колонку текста
            tasks, // Удаляем все задания к отрывку
            ...cleanExcerpt // Оставляем всё остальное
          } = excerpt;

          // Добавляем только метаданные отрывка
          excerpts.push({
            ...cleanExcerpt,
            hasText: !!text, // Флаг наличия текста
            tasksCount: countExcerptTasks(tasks), // Количество заданий
          });
        }
      }

      // 2. Обрабатываем произведение (work)
      const {
        commonTasks, // Удаляем, т.к. это "сырые" данные, не нужны в сторе
        characters, // Удаляем, т.к. это "сырые" данные, не нужны в сторе
        ...cleanWork
      } = work;

      // Сохраняем метаданные произведения с сокращёнными отрывками
      works.push({
        ...cleanWork,
        exercisesCount: {
          task1: work.commonTasks?.task1?.length || 0,
          task2: work.commonTasks?.task2?.length || 0,
          task3: work.commonTasks?.task3?.length || 0,
        },
        excerptsCount: excerpts.length,
        excerpts, // Сохраняем массив сокращённых отрывков
      });

      // 3. Извлекаем автора (poet)
      if (work.author && work.authorId) {
        poetsMap.set(work.authorId, {
          authorId: work.authorId,
          name: work.author,
        });
      }
    }
  }

  const poets = Array.from(poetsMap.values());

  // Формируем итоговый объект, готовый для сохранения в стор
  const result: KnowledgeBasePayload = {
    works,
    poets: rawPayload.poets || poets, // Если в rawPayload есть poets, используем их, иначе используем извлечённые из works
    stats: rawPayload.stats || {},
    settings: rawPayload.settings || {},
  };

  return result;
}

/**
 * Подсчитывает общее количество заданий в отрывке
 */
function countExcerptTasks(tasks: any): number {
  if (!tasks) return 0;

  let count = 0;

  // Считаем custom задания
  if (Array.isArray(tasks.customTask1)) count += tasks.customTask1.length;
  if (Array.isArray(tasks.customTask2)) count += tasks.customTask2.length;
  if (Array.isArray(tasks.customTask3)) count += tasks.customTask3.length;

  // Считаем задания с развёрнутым ответом
  if (Array.isArray(tasks.task4_1)) count += tasks.task4_1.length;
  if (Array.isArray(tasks.task4_2)) count += tasks.task4_2.length;

  // Считаем задания на сопоставление
  if (Array.isArray(tasks.task5)) count += tasks.task5.length;

  return count;
}
