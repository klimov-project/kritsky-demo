import type { GeneratedVariant } from '@/types/generatedVariant';
import type {
  RuntimeVariantBlockKey,
  VariantTaskKey,
} from '@/types/variantTasks';

export const useGenerateVariant = () => {
  const {
    variant,
    selectedWorkId,
    selectedExcerptId,
    selectedPoetId,
    selectedPoemId,
    selectedThemeId,
    refreshLoadingByBlock,
    refreshLoadingByTask,
    statusMessage,
    checkedAnswers,
  } = useVariantState();

  const config = useRuntimeConfig();
  // const apiUrl = import.meta.server
  //   ? config.apiBackendUrl
  //   : config.public.apiUrl;

  const apiUrl = import.meta.server
    ? config.apiBackendUrl
    : 'http://localhost:8000/api';

  const buildPayload = () => ({
    selectedWorkId: selectedWorkId.value,
    selectedExcerptId: selectedExcerptId.value,
    selectedPoetId: selectedPoetId.value,
    selectedPoemId: selectedPoemId.value,
    selectedThemeId: selectedThemeId.value,
    selectedBlock3AuthorId: '',
  });

  const pregenerateVariant = async () => {
    const pregeneratedUrl = `${apiUrl}/variants/runtime/pregenerated`;
    try {
      const data = await $fetch<{ variant: GeneratedVariant }>(pregeneratedUrl);
      variant.value = data.variant;
      statusMessage.value = '';
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value = e.message || 'Ошибка генерации варианта';
    }
  };

  const generateVariant = async () => {
    refreshLoadingByBlock.value.block1 = true;
    refreshLoadingByBlock.value.block2 = true;
    refreshLoadingByBlock.value.block3 = true;
    const generateUrl = `${apiUrl}/variants/runtime/generate`;

    try {
      const data = await $fetch<{ variant: GeneratedVariant }>(generateUrl, {
        method: 'POST',
        body: buildPayload(),
      });
      variant.value = data.variant;
      statusMessage.value = '';
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value = e.message || 'Ошибка генерации варианта';
    } finally {
      refreshLoadingByBlock.value.block1 = false;
      refreshLoadingByBlock.value.block2 = false;
      refreshLoadingByBlock.value.block3 = false;
    }
  };

  const refreshBlock = async (block: RuntimeVariantBlockKey) => {
    refreshLoadingByBlock.value[block] = true;
    try {
      const data = await $fetch<{ variant: GeneratedVariant }>(
        '/api/variants/runtime/refresh-block',
        {
          method: 'POST',
          body: {
            ...buildPayload(),
            block,
            variant: variant.value,
          },
        },
      );
      variant.value = data.variant;
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value = e.message || `Ошибка обновления блока ${block}`;
    } finally {
      refreshLoadingByBlock.value[block] = false;
    }
  };

  const refreshTask = async (taskKey: VariantTaskKey) => {
    refreshLoadingByTask.value[taskKey] = true;
    try {
      const data = await $fetch<{ variant: GeneratedVariant }>(
        '/api/variants/runtime/refresh-task',
        {
          method: 'POST',
          body: {
            ...buildPayload(),
            taskKey,
            variant: variant.value,
          },
        },
      );
      variant.value = data.variant;
      checkedAnswers.value.delete(taskKey);
    } catch (e) {
      statusMessage.value = e.message || `Ошибка обновления задания ${taskKey}`;
    } finally {
      refreshLoadingByTask.value[taskKey] = false;
    }
  };

  return {
    pregenerateVariant,
    generateVariant,
    refreshBlock,
    refreshTask,
  };
};
