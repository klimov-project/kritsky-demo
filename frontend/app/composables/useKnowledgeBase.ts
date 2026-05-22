import type { KnowledgeBaseResponse } from '~/types/knowledgeBaseTypes';

import { USE_MOCK } from '~/utils/mode/mode';
import type { mKnowledgeBaseResponse } from './mockData';
import { mockKnowledgeBaseResponse, mockStore } from './mockData';

export function useKnowledgeBase() {
  // В моковом режиме возвращаем сразу заглушку, даже не инициализируя запрос
  if (USE_MOCK) {
    const mockPending = ref(false);
    const mockError = ref(null);
    const mockData = ref<mKnowledgeBaseResponse>(mockKnowledgeBaseResponse);

    const refresh = () => {
      console.log('[Mock] Refresh called');
      mockPending.value = true;
      setTimeout(() => {
        mockPending.value = false;
      }, 300);
    };

    const variantsCount = computed(() => {
      return mockData.value?._metadata?.computed?.variantsCount ?? 0;
    });

    const works = computed(() => mockKnowledgeBaseResponse.works ?? []);
    const poets = computed(() => mockKnowledgeBaseResponse.poets ?? []);
    const themes = computed(() => []);

    return {
      data: readonly(mockData),
      works,
      poets,
      themes,
      pending: readonly(mockPending),
      error: readonly(mockError),
      refresh,
      variantsCount,
      store: mockStore,
    };
  }

  // Режим реального API
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
        // Гидрация только если хеш изменился
        if (response._metadata?.hash !== store.lastKnownHash) {
          console.log(
            '[Store] Hydrating, response._metadata:',
            response._metadata,
          );
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

  const works = computed(() => data.value?.works ?? []);
  const poets = computed(() => data.value?.poets ?? []);
  const themes = computed(() => []);

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
