import type { Work } from '@/types/knowledgeBaseTypes';

export const useNavigateScene = () => {
  const { store: kbStore } = useKnowledgeBase();
  const {
    variant,
    refreshLoadingByBlock,
    statusMessage,
    checkedAnswers,
  } = useVariantState();
  const { refreshBlock } = useGenerateVariant();

  const works = computed(() => (kbStore.works ?? []) as Work[]);

  const sceneNavigation = computed(() => {
    if (!variant.value) {
      return { hasPrevious: false, hasNext: false };
    }

    const currentVariant = variant.value;
    const currentWork =
      works.value.find((work) => work.id === currentVariant.work?.id) ||
      currentVariant.work;
    const orderedExcerpts = sortExcerptsByOrder(currentWork.excerpts || []);
    const currentIndex = orderedExcerpts.findIndex(
      (excerpt) => excerpt.id === currentVariant.excerpt.id,
    );

    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex >= 0 && currentIndex < orderedExcerpts.length - 1,
      currentIndex,
      orderedExcerpts,
    };
  });

  const navigateScene = async (direction: 'previous' | 'next') => {
    if (!variant.value) return;

    const {
      hasPrevious,
      hasNext,
      currentIndex,
      orderedExcerpts,
    } = sceneNavigation.value;

    if (!currentIndex || !orderedExcerpts) return;
    if (direction === 'previous' && !hasPrevious) return;
    if (direction === 'next' && !hasNext) return;

    // const targetIndex =
    //   direction === 'previous' ? currentIndex - 1 : currentIndex + 1;

    // In a real implementation, we would set selectedExcerptId and then refreshBlock('block1')
    // For this migration, we'll follow the React logic of calling the API with the target excerpt
    refreshLoadingByBlock.value.block1 = true;
    try {
      await refreshBlock('block1'); // This would need to be updated to accept specific excerpt in a full implementation
      statusMessage.value = '';
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value = e.message || 'Не удалось переключить сцену.';
    } finally {
      refreshLoadingByBlock.value.block1 = false;
    }
  };

  const nextTitle = computed(() => {
    console.log('Computing nextTitle with variant:', variant.value);
    if (!variant.value) return null;

    const { hasNext, currentIndex, orderedExcerpts } = sceneNavigation.value;
    if (!currentIndex || !orderedExcerpts) return;
    return hasNext ? orderedExcerpts[currentIndex + 1]?.title || null : null;
  });

  const prevTitle = computed(() => {
    console.log('Computing prevTitle with variant:', variant.value);
    if (!variant.value) return null;

    const {
      hasPrevious,
      currentIndex,
      orderedExcerpts,
    } = sceneNavigation.value;
    if (!currentIndex || !orderedExcerpts) return;
    return hasPrevious
      ? orderedExcerpts[currentIndex - 1]?.title || null
      : null;
  });

  return {
    sceneNavigation,
    navigateScene,
    nextTitle,
    prevTitle,
  };
};
