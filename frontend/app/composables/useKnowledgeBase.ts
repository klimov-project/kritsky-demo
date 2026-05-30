import type { KnowledgeBaseResponse } from '~/types/knowledgeBaseTypes';
import type { GeneratedVariant } from '@/types/generatedVariant';

import { USE_MOCK } from '~/utils/mode/mode';
import type { mKnowledgeBaseResponse } from './mockData';
import { mockKnowledgeBaseResponse, mockStore } from './mockData';

export function useKnowledgeBase() {
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
    const settings = computed(() => mockStore.settings ?? null);
    const weeklyVariant = computed<GeneratedVariant | null>(
      () => settings.value?.weeklyVariant ?? null,
    );

    return {
      data: readonly(mockData),
      works,
      poets,
      themes,
      settings,
      weeklyVariant,

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

  const apiUrl = config.public.nitroApiUrl;

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
  const themes = computed(() => store.themes ?? {});
  // weeklyVariant здесь уже приходит без форматирования, пока он не обновляется - берём моковый с форматированием
  // и settings тоже
  const settings = computed(
    () => mockStore.settings ?? DEFAULT_KNOWLEDGE_BASE_SETTINGS,
  );
  const weeklyVariant = computed<GeneratedVariant | null>(
    () => settings.value?.weeklyVariant ?? null,
  );

  return {
    data,
    works,
    poets,
    themes,
    settings,
    weeklyVariant,

    pending,
    error,
    refresh,
    variantsCount,
    store,
  };
}
