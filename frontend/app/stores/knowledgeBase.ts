export interface KnowledgeBasePayload {
  works?: Array<Record<string, any>>;
  poets?: Array<Record<string, any>>;
  stats?: Record<string, any>;
  settings?: Record<string, any>;
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

export const useKnowledgeBaseStore = defineStore('knowledgeBase', {
  state: () => ({
    knowledgeBase: null as KnowledgeBasePayload | null,
    works: [] as Array<Record<string, any>>,
    poets: [] as Array<Record<string, any>>,
    stats: {} as Record<string, any>,
    settings: {} as Record<string, any>,
    lastFetchedAt: null as string | null,
    isLoading: false,
    error: null as string | null,
    lastKnownHash: null as string | null,
  }),

  getters: {
    hasData: (state) => !!state.knowledgeBase,
    worksCount: (state) => state.works.length,
    poetsCount: (state) => state.poets.length,
    variantsCount: (state) =>
      state.knowledgeBase?._metadata?.computed?.variantsCount,
    isStale: (state) => {
      if (!state.knowledgeBase?._metadata?.fetchedAt) return true;
      const fetchedTime = new Date(
        state.knowledgeBase._metadata.fetchedAt,
      ).getTime();
      return Date.now() - fetchedTime > 5 * 60 * 1000;
    },
  },

  actions: {
    hydrate(payload: KnowledgeBasePayload) {
      if (!payload) {
        return;
      }

      // Полный payload - обновляем стор
      this.knowledgeBase = payload;
      this.works = Array.isArray(payload.works) ? payload.works : [];
      this.poets = Array.isArray(payload.poets) ? payload.poets : [];
      this.stats = payload.stats ?? {};
      this.lastFetchedAt =
        payload._metadata?.fetchedAt ?? new Date().toISOString();
      this.settings = payload.settings || {};

      if (payload._metadata?.hash) {
        this.lastKnownHash = payload._metadata?.hash;
        console.log('Updated store with payload, hash:', this.lastKnownHash);
      }
    },

    async fetchKnowledgeBase(force = false) {
      if (this.hasData && !force) {
        console.log('Using existing store data');
        return this.knowledgeBase;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const config = useRuntimeConfig();
        const kbUrl = `${config.public.apiUrl}/knowledge-base`;

        const response = await $fetch<KnowledgeBasePayload>(kbUrl);

        // const transformedPayload = transformToKnowledgeBasePayload(response);
        // this.hydrate(transformedPayload);
        console.log('Full payload received, hydrating store');
        this.hydrate(response);

        console.log('Hydrated store:', {
          works: this.works.length,
          poets: this.poets.length,
          hash: this.lastKnownHash,
        });

        return response;
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        this.error =
          (error as Error)?.message || 'Не удалось загрузить базу знаний.';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

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
    poets,
    stats: rawPayload.stats || {},
    settings: rawPayload.settings || {},
    _metadata: {
      hash: rawPayload._hash || undefined, // Прокидываем хеш, если он есть
      fetchedAt: new Date().toISOString(),
      computed: {
        variantsCount: calculateTotalVariants(rawPayload) || 555555,
        poetsCount: rawPayload.poets?.length || 0,
        totalEntities:
          (rawPayload.works?.length || 0) + (rawPayload.poets?.length || 0),
      },
    },
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
