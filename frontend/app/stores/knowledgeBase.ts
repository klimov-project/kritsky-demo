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
    stats: {} as Record<string, any>,
    settings: {} as Record<string, any>,
    isHydrated: false,
    lastKnownHash: null as string | null,
  }),

  getters: {
    works: (state) => state.knowledgeBase?.works || [],
    poets: (state) => state.knowledgeBase?.poets || [],
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

      this.knowledgeBase = payload;
      this.isHydrated = true;
      this.stats = payload.stats ?? {};
      this.settings = payload.settings || {};
      this.lastKnownHash = payload._metadata?.hash || null;
    },
  },
});
