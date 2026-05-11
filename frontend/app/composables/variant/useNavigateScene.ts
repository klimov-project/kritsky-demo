import type { Work } from '@/types/knowledgeBaseTypes';

export const useNavigateScene = (
  variant: Ref<any | null>,
  works: Ref<Work[]>,
) => {
  const sceneNavigation = computed(() => {
    const variantRef = useVariant();

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

  return { sceneNavigation };
};
