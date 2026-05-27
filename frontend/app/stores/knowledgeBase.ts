import type { KnowledgeBasePayload } from '@/types/knowledgeBaseTypes';

export const useKnowledgeBaseStore = defineStore('knowledgeBase', {
  state: () => ({
    knowledgeBase: null as KnowledgeBasePayload | null,
    stats: {} as Record<string, any>,
    settings: {} as Record<string, any>,
    isHydrated: false,
    lastKnownHash: null as string | null,
  }),

  getters: {
    works: (state) => state.knowledgeBase?.works || [],
    poets: (state) => state.knowledgeBase?.poets || [],
    themes: (state) => state.knowledgeBase?.themes || [],
    worksCount: (state) => state.knowledgeBase?.works?.length,
    poetsCount: (state) => state.knowledgeBase?.poets?.length,
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
      if (!payload) return;
      if (payload._metadata?.hash === this.lastKnownHash) {
        console.log('Хеш не изменился, пропускаем гидрацию');
        return;
      }

      const normalized = normalizeKnowledgeBasePayload(payload);
      this.knowledgeBase = normalized;
      this.isHydrated = true;
      this.stats = normalized.stats ?? {};
      this.settings = normalized.settings || {};
      this.lastKnownHash = normalized._metadata?.hash || null;
    },
  },
});
