export interface KnowledgeBasePayload {
  works?: Array<Record<string, any>>;
  poets?: Array<Record<string, any>>;
  stats?: Record<string, any>;
  fetchedAt?: string;
  settings?: Record<string, any>;
  _hash?: string;
  _fromCache?: boolean;
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
  },

  actions: {
    hydrate(payload: KnowledgeBasePayload) {
      if (!payload) {
        return;
      }

      // Проверяем, пришел ли только хеш или полный payload
      if (payload._fromCache && payload._hash) {
        console.log('Received hash-only response, using existing store data');
        // Используем существующие данные в сторе
        if (!this.knowledgeBase) {
          console.warn(
            'No existing data in store and received hash-only response',
          );
        }
        return;
      }

      // Полный payload - обновляем стор
      this.knowledgeBase = payload;
      this.works = Array.isArray(payload.works) ? payload.works : [];
      this.poets = Array.isArray(payload.poets) ? payload.poets : [];
      this.stats = payload.stats ?? {};
      this.lastFetchedAt = payload.fetchedAt ?? new Date().toISOString();
      this.settings = payload.settings || {};

      if (payload._hash) {
        this.lastKnownHash = payload._hash;
        console.log('Updated store with payload, hash:', payload._hash);
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
        console.log('fetchKnowledgeBase `/api/knowledge-base `');
        console.log('config.public.apiUrl', config.public.apiUrl);
        const kbUrl = `${config.public.apiUrl}/knowledge-base`;

        const response = await $fetch<KnowledgeBasePayload>(kbUrl);

        console.log(
          'Response type:',
          response?._fromCache ? 'HASH_ONLY' : 'FULL_PAYLOAD',
        );

        if (response?._fromCache) {
          console.log('Using cached data from store');
          // Данные уже в сторе с предыдущей гидратации
          return this.knowledgeBase;
        }

        const transformedPayload = transformToKnowledgeBasePayload(response);
        this.hydrate(transformedPayload);
        // console.log('Full payload received, hydrating store');
        // this.hydrate(response);

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
    fetchedAt: new Date().toISOString(),
    _hash: rawPayload._hash || undefined, // Прокидываем хеш, если он есть
    _fromCache: false, // Явно указываем, что это свежие данные
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

// Пример использования в вашем компоненте или init-скрипте:
// import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'; // Ваш путь к стору

// async function initStore() {
//   const store = useKnowledgeBaseStore();
//   try {
//     // rawData — это ответ от вашего API (тот самый большой JSON)
//     const response = await fetch('/api/knowledge-base');
//     const rawData = await response.json();
//
//     const transformedPayload = transformToKnowledgeBasePayload(rawData);
//     store.hydrate(transformedPayload);
//
//     console.log('Стор успешно обновлён сокращёнными данными');
//   } catch (error) {
//     store.error = 'Не удалось загрузить или обработать базу знаний';
//     console.error(error);
//   }
// }
