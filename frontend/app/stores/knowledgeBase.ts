import { cachedFetch } from '~/utils/cached-fetch';

export interface KnowledgeBasePayload {
  works?: Array<Record<string, any>>;
  poets?: Array<Record<string, any>>;
  stats?: Record<string, any>;
  fetchedAt?: string;
}

export const useKnowledgeBaseStore = defineStore('knowledgeBase', {
  state: () => ({
    knowledgeBase: null as KnowledgeBasePayload | null,
    works: [] as Array<Record<string, any>>,
    poets: [] as Array<Record<string, any>>,
    stats: {} as Record<string, any>,
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
    },

    async fetchKnowledgeBase(force = false) {
      if (this.hasData && !force) {
        return this.knowledgeBase;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const config = useRuntimeConfig();
        const apiUrl = import.meta.server
          ? `${config.apiBackendBase}/api/knowledge-base`
          : '/api/knowledge-base';

        // Temporarily disable caching for debugging
        console.log('Fetching knowledge base from:', apiUrl);
        const payload = await $fetch<KnowledgeBasePayload>(apiUrl);
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
