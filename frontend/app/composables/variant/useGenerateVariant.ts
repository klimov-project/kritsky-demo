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
    task11Refreshes,
    cachedPreGeneratedVariant,
    hasCachedPreGeneratedVariant,
  } = useVariantState();

  const config = useRuntimeConfig();
  const { isAuthenticated, isLocked } = useAuth();
  const { apiWithAuth } = useAuthApi();
  const { showPaywall } = useSubscription();

  /**
   * Удаляет все style-атрибуты из HTML-строк во всех строковых полях объекта (рекурсивно)
   * Учитывает экранированные кавычки (&quot;) внутри значений атрибутов
   * @param {*} obj - объект или значение любой вложенности
   * @returns {*} - новый объект с очищенными строками
   */
  function removeStyleAttributes(obj) {
    if (typeof obj === 'string') {
      // Сначала декодируем HTML-сущности в кавычках для упрощения парсинга,
      // затем удаляем style атрибуты, затем восстанавливаем сущности обратно.
      // Но лучше работать напрямую с регуляркой, учитывающей &quot;

      // Удаляем style="..." где внутри могут быть &quot; (экранированные кавычки)
      // и обычные кавычки, но не пересекающиеся с границами атрибута
      let result = obj.replace(
        /\s*style\s*=\s*"(?:[^"\\]|\\[\s\S]|&quot;)*"/gi,
        '',
      );

      // Удаляем style='...' (с одинарными кавычками)
      result = result.replace(
        /\s*style\s*=\s*'(?:[^'\\]|\\[\s\S]|&apos;)*'/gi,
        '',
      );

      // Удаляем возможные двойные пробелы, оставшиеся после удаления атрибутов
      result = result.replace(/\s{2,}/g, ' ');
      result = result.replace(/\s>/g, '>');

      return result;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => removeStyleAttributes(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const result = {};
      for (const key of Object.keys(obj)) {
        result[key] = removeStyleAttributes(obj[key]);
      }
      return result;
    }

    return obj;
  }

  const apiUrl = import.meta.server
    ? config.apiBackendUrl
    : config.public.apiUrl;

  /**
   * Build payload with task1 filters for block1 refresh
   */
  const buildPayload = (includeTask1Filters = true) => {
    let task1Filters = {
      includeWorkQuestions: true,
      includeTermQuestions: true,
    };

    // Get filters from TermQuestionToggles if available
    if (includeTask1Filters) {
      const termToggles = useTermQuestionToggles?.();
      if (termToggles) {
        task1Filters = {
          includeWorkQuestions: termToggles.includeWorkQuestions?.value ?? true,
          includeTermQuestions: termToggles.includeTermQuestions?.value ?? true,
        };
      }
    } else {
      task1Filters = {
        includeWorkQuestions: false,
        includeTermQuestions: false,
      };
    }

    return {
      selectedWorkId: selectedWorkId.value,
      selectedExcerptId: selectedExcerptId.value,
      selectedPoetId: selectedPoetId.value,
      selectedPoemId: selectedPoemId.value,
      selectedThemeId: selectedThemeId.value,
      selectedBlock3AuthorId: '',
      task1Filters,
    };
  };

  /**
   * Pregenerated variant - cached for unauthenticated users
   */
  const pregenerateVariant = async () => {
    // Return cached variant if available for unauthenticated users
    if (!isAuthenticated.value && hasCachedPreGeneratedVariant.value) {
      variant.value = cachedPreGeneratedVariant.value;
      statusMessage.value = '';
      checkedAnswers.value.clear();
      return;
    }

    const pregeneratedUrl = `${apiUrl}/variants/runtime/pregenerated`;
    try {
      const data = await $fetch<{ variant: GeneratedVariant }>(pregeneratedUrl);

      variant.value = removeStyleAttributes(data.variant);

      // Cache for unauthenticated users
      if (!isAuthenticated.value) {
        cachedPreGeneratedVariant.value = data.variant;
        hasCachedPreGeneratedVariant.value = true;
      }

      statusMessage.value = '';
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value = (e as Error).message || 'Ошибка генерации варианта';
    }
  };

  /**
   * Generate new random variant - requires authentication
   */
  const generateVariant = async () => {
    if (isLocked.value) {
      showPaywall();
      statusMessage.value = 'Для создания нового варианта необходима подписка';
      return;
    }

    refreshLoadingByBlock.value.block1 = true;
    refreshLoadingByBlock.value.block2 = true;
    refreshLoadingByBlock.value.block3 = true;

    try {
      const data = await apiWithAuth<{ variant: GeneratedVariant }>(
        '/variants/runtime/generate',
        {
          method: 'POST',
          body: {
            ...buildPayload(),
            useSelected: false,
          },
        },
      );
      variant.value = data.variant;
      statusMessage.value = '';
      checkedAnswers.value.clear();
      task11Refreshes.value = 0; // Reset task11 refreshes
    } catch (e) {
      statusMessage.value = (e as Error).message || 'Ошибка генерации варианта';
    } finally {
      refreshLoadingByBlock.value.block1 = false;
      refreshLoadingByBlock.value.block2 = false;
      refreshLoadingByBlock.value.block3 = false;
    }
  };

  /**
   * Refresh block - requires authentication
   */
  const refreshBlock = async (
    block: RuntimeVariantBlockKey,
    blockRodPreference?: Record<string, string>,
  ) => {
    if (isLocked.value) {
      showPaywall();
      // statusMessage.value = 'Для обновления блока необходима подписка'
      return;
    }

    refreshLoadingByBlock.value[block] = true;
    try {
      const payload: any = {
        ...buildPayload(block === 'block1'),
        block,
        variant: variant.value,
      };

      // Add block3 rod preference if provided
      if (block === 'block3' && blockRodPreference) {
        payload.block11RodPreference = blockRodPreference;
      }

      const data = await apiWithAuth<{ variant: GeneratedVariant }>(
        '/variants/runtime/refresh-block',
        {
          method: 'POST',
          body: payload,
        },
      );
      variant.value = data.variant;
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value =
        (e as Error).message || `Ошибка обновления блока ${block}`;
    } finally {
      refreshLoadingByBlock.value[block] = false;
    }
  };

  /**
   * Refresh individual task - requires authentication
   * For task11 tasks: increment counter (max 3)
   */
  const refreshTask = async (taskKey: VariantTaskKey) => {
    console.log(
      `Attempting with isAuthenticated: ${isAuthenticated.value}, isLocked: ${isLocked.value}`,
    );

    if (isLocked.value) {
      showPaywall();
      // statusMessage.value = 'Для обновления задания необходима подписка';
      return;
    }

    console.log(
      `Refreshing task ${taskKey}, current task11 refreshes: ${task11Refreshes.value}`,
    );

    // Check task11 refresh limit
    if (
      taskKey.startsWith('task11_') &&
      task11Refreshes.value >= 3 &&
      !isLocked.value
    ) {
      // statusMessage.value =
      //   'Достигнут максимум обновлений для 11-классных заданий (3)';
      return;
    }

    console.log(`refreshLoadingByTask: ${refreshLoadingByTask.value}`);
    refreshLoadingByTask.value[taskKey] = true;
    try {
      console.log(`taskKey: ${taskKey}`);
      const payload: any = {
        ...buildPayload(false),
        taskKey,
        variant: variant.value,
        excludedTaskIds: [],
      };
      console.log(`payload:`, payload);
      let dataTask;
      if (isAuthenticated.value) {
        dataTask = await apiWithAuth<{ variant: GeneratedVariant }>(
          '/variants/runtime/refresh-task',
          {
            method: 'POST',
            body: payload,
          },
        );
      } else {
        const refreshTaskUrl = `${apiUrl}/variants/runtime/refresh-task`;
        dataTask = await $fetch<{ variant: GeneratedVariant }>(refreshTaskUrl, {
          method: 'POST',
          body: payload,
        });
      }

      variant.value = dataTask.variant;
      checkedAnswers.value.delete(taskKey);

      // Increment task11 refresh counter
      if (taskKey.startsWith('task11_')) {
        task11Refreshes.value++;
      }
    } catch (e) {
      statusMessage.value =
        (e as Error).message || `Ошибка обновления задания ${taskKey}`;
    } finally {
      refreshLoadingByTask.value[taskKey] = false;
    }
  };

  /**
   * Refresh all tasks in variant - requires authentication
   */
  const refreshAllTasks = async () => {
    if (isLocked.value) {
      showPaywall();
      statusMessage.value = 'Для обновления всех заданий необходима подписка';
      return;
    }

    // Set all loading states
    Object.keys(refreshLoadingByTask.value).forEach((key) => {
      refreshLoadingByTask.value[key as VariantTaskKey] = true;
    });

    try {
      const data = await apiWithAuth<{ variant: GeneratedVariant }>(
        '/variants/runtime/generate',
        {
          method: 'POST',
          body: {
            ...buildPayload(),
            useSelected: true,
          },
        },
      );
      variant.value = data.variant;
      statusMessage.value = '';
      checkedAnswers.value.clear();
      task11Refreshes.value = 0; // Reset task11 refreshes
    } catch (e) {
      statusMessage.value =
        (e as Error).message || 'Ошибка обновления всех заданий';
    } finally {
      Object.keys(refreshLoadingByTask.value).forEach((key) => {
        refreshLoadingByTask.value[key as VariantTaskKey] = false;
      });
    }
  };

  return {
    pregenerateVariant,
    generateVariant,
    refreshBlock,
    refreshTask,
    refreshAllTasks,
  };
};
