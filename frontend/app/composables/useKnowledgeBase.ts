import type { KnowledgeBasePayload } from '~/stores/knowledgeBase';

interface KnowledgeBaseResponse extends KnowledgeBasePayload {
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
        console.log('Не делаем повторный запрос если данные свежие');
        const cached = useNuxtApp().payload.data[key];
        if (cached) {
          console.log('Автоматически обновляем стор из кеша');
          console.log('cached? ');
          store.hydrate(cached);
          return cached;
        }
      },
      transform: (response) => {
        console.log('Трансформируем данные после получения');
        console.log('Данные уже пришли с сервера обогащённые');
        store.hydrate(response);
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

  // Вычисляемые значения на основе данных
  const variantsCount = computed(() => {
    return data.value?._metadata?.computed?.variantsCount;
  });

  return {
    data,
    pending,
    error,
    refresh,
    variantsCount,
    store,
  };
}
