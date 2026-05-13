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

export function useKnowledgeBase() {
  const store = useKnowledgeBaseStore();

  const { data, pending, error, refresh } = useFetch<KnowledgeBaseResponse>(
    '/api/knowledge-base',
    {
      server: true,
      key: 'knowledge-base',
      getCachedData: (key) => {
        const cached = useNuxtApp().payload.data[key];
        return cached || undefined;
      },
      transform: (response) => {
        // Гидрация только если хеш изменился
        if (response._metadata?.hash !== store.lastKnownHash) {
          console.log('[Store] Hydrating, new hash:', response._metadata?.hash);
          store.hydrate(response);
        }
        return response;
      },
      // Проверяем нужно ли обновление по хешу
      onResponse: ({ response }) => {
        if (response._data?._metadata?.hash === store.lastKnownHash) {
          console.log('Данные не изменились, используем кеш');
        }
      },
    },
  );

  const variantsCount = computed(() => {
    return data.value?._metadata?.computed?.variantsCount ?? 0;
  });

  const works = computed(() => data.value?.works || []);
  const poets = computed(() => data.value?.poets || []);

  return {
    data,
    works,
    poets,
    pending,
    error,
    refresh,
    variantsCount,
    store,
  };
}
