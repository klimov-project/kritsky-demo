import type { KnowledgeBasePayload } from '@/types/knowledgeBaseTypes';

export const useKnowledgeBaseStore = defineStore('knowledgeBase', {
  state: () => ({
    knowledgeBase: null as KnowledgeBasePayload | null,
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
      state.knowledgeBase?._metadata?.computed?.variantsCount ?? 0,
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
      this.lastKnownHash = payload._metadata?.hash || null;
    },
  },
});
