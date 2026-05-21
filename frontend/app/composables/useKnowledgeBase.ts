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
  const config = useRuntimeConfig();

  const apiUrl = import.meta.server
    ? `${config.apiBackendBase}/api`
    : config.public.nitroApiUrl;

  const { data, pending, error, refresh } = useFetch<KnowledgeBaseResponse>(
    `${apiUrl}/knowledge-base`,
    {
      server: true,
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
    },
  );

  const variantsCount = computed(() => {
    return data.value?._metadata?.computed?.variantsCount ?? 0;
  });

  const works = computed(() => store.works || []);
  const poets = computed(() => store.poets || []);
  const themes = computed(() => store.themes || []);

  return {
    data,
    works,
    poets,
    themes,
    pending,
    error,
    refresh,
    variantsCount,
    store,
  };
}
