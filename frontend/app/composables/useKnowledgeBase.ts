import { useKnowledgeBaseStore } from '~/stores/knowledgeBase';

export const useKnowledgeBase = () => {
  const kbStore = useKnowledgeBaseStore();

  const loadKnowledgeBase = async (force = false) => {
    if (!kbStore.hasData || force) {
      await kbStore.fetchKnowledgeBase(force);
    }
    return kbStore;
  };

  return {
    kbStore,
    loadKnowledgeBase,
  };
};