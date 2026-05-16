import type {
  KnowledgeBasePayload,
  Poet,
  Work,
} from '~/types/knowledgeBaseTypes';

interface KnowledgeBaseResponse extends KnowledgeBasePayload {
  works?: Work[];
  poets?: Poet[];
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

// Полный мок с данными для разработки
const mockData: KnowledgeBaseResponse = {
  works: [
    {
      id: 1,
      title: 'Евгений Онегин',
      slug: 'evgeniy-onegin',
      poetId: 1,
      year: 1833,
      chapters: [
        {
          id: 1,
          title: 'Глава 1',
          order: 1,
          excerpts: [
            {
              id: 1,
              title: 'Мой дядя самых честных правил',
              order: 1,
            },
            {
              id: 2,
              title: 'Зима! Крестьянин, торжествуя',
              order: 2,
            },
          ],
        },
        {
          id: 2,
          title: 'Глава 2',
          order: 2,
          excerpts: [
            {
              id: 3,
              title: 'Деревня, где скучал Евгений',
              order: 1,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Бородино',
      slug: 'borodino',
      poetId: 2,
      year: 1837,
      chapters: [
        {
          id: 3,
          title: 'Полный текст',
          order: 1,
          excerpts: [
            {
              id: 4,
              title: 'Скажи-ка, дядя, ведь недаром',
              order: 1,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Мцыри',
      slug: 'mtsyri',
      poetId: 2,
      year: 1839,
      chapters: [
        {
          id: 4,
          title: 'Часть 1',
          order: 1,
          excerpts: [
            {
              id: 5,
              title: 'Немного лет тому назад',
              order: 1,
            },
          ],
        },
      ],
    },
  ],
  poets: [
    {
      id: 1,
      name: 'Александр Пушкин',
      slug: 'aleksandr-pushkin',
      bio: 'Великий русский поэт',
      worksCount: 1,
    },
    {
      id: 2,
      name: 'Михаил Лермонтов',
      slug: 'mikhail-lermontov',
      bio: 'Русский поэт и прозаик',
      worksCount: 2,
    },
  ],
  themes: [
    {
      id: 1,
      name: 'Любовь',
      slug: 'love',
      worksCount: 2,
    },
    {
      id: 2,
      name: 'Природа',
      slug: 'nature',
      worksCount: 3,
    },
    {
      id: 3,
      name: 'Война',
      slug: 'war',
      worksCount: 1,
    },
    {
      id: 4,
      name: 'Свобода',
      slug: 'freedom',
      worksCount: 1,
    },
  ],
  _metadata: {
    hash: 'dev-mock-hash-v1',
    fetchedAt: new Date().toISOString(),
    computed: {
      variantsCount: 42,
      poetsCount: 2,
      totalEntities: 3,
    },
  },
};

export function useKnowledgeBase() {
  const store = useKnowledgeBaseStore();
  const config = useRuntimeConfig();

  const isDev = config.public.devMode || import.meta.dev;

  // Полностью отключаем запрос в dev-режиме
  const shouldFetch = !isDev;

  const { data, pending, error, refresh } = useFetch<KnowledgeBaseResponse>(
    '/api/knowledge-base',
    {
      // Отключаем запрос и на сервере, и на клиенте в dev-режиме
      server: shouldFetch,
      lazy: !shouldFetch,
      immediate: shouldFetch,

      key: 'knowledge-base',
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        return cached || undefined;
      },
      transform: (response) => {
        if (response._metadata?.hash !== store.lastKnownHash) {
          console.log('[Store] Hydrating, new hash:', response._metadata?.hash);
          store.hydrate(response);
        }
        return response;
      },
      onRequestError: () => {
        console.warn('[Dev] Request failed, but we are on mock data');
      },
    },
  );

  // В dev режиме сразу инициализируем мок-данными
  if (isDev) {
    // Выполняется один раз при первой загрузке
    if (!store._initialized) {
      console.log('[Dev] Initializing store with mock data');
      store.hydrate(mockData);
      store._initialized = true;
    }
  }

  const variantsCount = computed(() => {
    return (
      store._metadata?.computed?.variantsCount ??
      mockData._metadata!.computed.variantsCount
    );
  });

  const works = computed(() => store.works || []);
  const poets = computed(() => store.poets || []);
  const themes = computed(() => store.themes || []);

  return {
    data: computed(() => (isDev ? mockData : data.value)),
    works,
    poets,
    themes,
    pending: computed(() => (isDev ? false : pending.value)),
    error: computed(() => (isDev ? null : error.value)),
    refresh: isDev ? () => Promise.resolve() : refresh,
    variantsCount,
    store,
  };
}
