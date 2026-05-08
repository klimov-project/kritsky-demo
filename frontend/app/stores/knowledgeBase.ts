export interface KnowledgeBasePayload {
  works?: Array<Record<string, any>>;
  poets?: Array<Record<string, any>>;
  stats?: Record<string, any>;
  fetchedAt?: string;
  settings: Record<string, any>;
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
  }),
  getters: {
    hasData: (state) => !!state.knowledgeBase,
    worksCount: (state) => state.works.length,
    poetsCount: (state) => state.poets.length,
  },
  actions: {
    hydrate(payload: KnowledgeBasePayload) {
      if (!payload) {
        this.knowledgeBase = null;
        this.works = [];
        this.poets = [];
        this.stats = {};
        this.lastFetchedAt = null;
        return;
      }

      this.knowledgeBase = payload;
      this.works = Array.isArray(payload.works) ? payload.works : [];
      this.poets = Array.isArray(payload.poets) ? payload.poets : [];
      this.stats = payload.stats ?? {};
      this.lastFetchedAt = payload.fetchedAt ?? new Date().toISOString();
      this.settings = payload.settings || {};
    },

    async fetchKnowledgeBase(force = false) {
      if (this.hasData && !force) {
        return this.knowledgeBase;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const config = useRuntimeConfig();
        console.log('fetchKnowledgeBase `/api/knowledge-base `  ');
        console.log('config.public.apiUrl', config.public.apiUrl);
        const kbUrl = `${config.public.apiUrl}/knowledge-base`;

        // Temporarily disable caching for debugging
        const payload = await $fetch<KnowledgeBasePayload>(kbUrl);
        console.log('Fetched payload:', {
          works: payload?.works?.length,
          poets: payload?.poets?.length,
        });

        this.hydrate(payload);
        console.log('Hydrated store:', {
          works: this.works.length,
          poets: this.poets.length,
        });
        return payload;
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        this.error =
          (error as Error)?.message || 'Не удалось загрузить базу знаний.';
        // Do not throw error to allow prerendering
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
