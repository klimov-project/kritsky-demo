import type { Work } from '@/types/knowledgeBaseTypes';
export const useNavigateScene = () => {
  const { store: kbStore } = useKnowledgeBase();

  const variantRef = useCurrentVariant();

  const works = computed(() => (kbStore.works ?? []) as Work[]);

  const sceneNavigation = computed(() => {
    if (!variantRef.value) {
      return { hasPrevious: false, hasNext: false };
    }

    const currentVariant = variantRef.value;
    const currentWork =
      works.value.find((work) => work.id === currentVariant.work.id) ||
      currentVariant.work;
    const orderedExcerpts = sortExcerptsByOrder(currentWork.excerpts || []);
    const currentIndex = orderedExcerpts.findIndex(
      (excerpt) => excerpt.id === currentVariant.excerpt.id,
    );

    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex >= 0 && currentIndex < orderedExcerpts.length - 1,
    };
  });

  return sceneNavigation;
};
