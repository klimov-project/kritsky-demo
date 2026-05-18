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
    useSelected,
  } = useVariantState();

  const config = useRuntimeConfig();
  const { isAuthenticated, openLoginModal, isLocked } = useAuth();
  const { showPaywall } = useSubscription();

  const { apiWithAuth } = useAuthApi();

  const apiUrl = import.meta.server
    ? config.apiBackendUrl
    : config.public.apiUrl;

  const buildPayload = () => ({
    selectedWorkId: selectedWorkId.value,
    selectedExcerptId: selectedExcerptId.value,
    selectedPoetId: selectedPoetId.value,
    selectedPoemId: selectedPoemId.value,
    selectedThemeId: selectedThemeId.value,
    selectedBlock3AuthorId: '',
    useSelected: useSelected.value,
  });

  /**
   * Make authenticated API call or prompt login
   * For routes that require auth, uses JWT token
   */
  const authFetch = async <T>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {},
    requireAuth = false,
  ): Promise<T> => {
    // If auth required but user not logged in, show login modal
    if (requireAuth && !isAuthenticated.value) {
      openLoginModal();
      throw new Error('Требуется авторизация');
    }

    // Use authenticated request if user is logged in
    if (isAuthenticated.value) {
      return apiWithAuth<T>(url, options);
    }

    // Public request (no auth)
    const fullUrl = url.startsWith('/')
      ? `${apiUrl}${url}`
      : `${apiUrl}/${url}`;
    return $fetch<T>(fullUrl, options);
  };

  const pregenerateVariant = async () => {
    const pregeneratedUrl = `${apiUrl}/variants/runtime/pregenerated`;
    try {
      const data = await $fetch<{ variant: GeneratedVariant }>(pregeneratedUrl);
      variant.value = data.variant; // setVariant
      statusMessage.value = '';
      checkedAnswers.value.clear();
    } catch (e) {
      statusMessage.value = (e as Error).message || 'Ошибка генерации варианта';
    }
  };

  /**
   * Generate variant - requires authentication
   */
  const generateVariant = async () => {
    // Check auth first
    if (!checkSubscription()) return;

    refreshLoadingByBlock.value.block1 = true;
    refreshLoadingByBlock.value.block2 = true;
    refreshLoadingByBlock.value.block3 = true;

    try {
      const data = await authFetch<{ variant: GeneratedVariant }>(
        '/variants/runtime/generate',
        {
          method: 'POST',
          body: buildPayload(),
        },
        true,
      );
      variant.value = data.variant;
      statusMessage.value = '';
      checkedAnswers.value.clear();
    } catch (e) {
      if ((e as Error).message !== 'Требуется авторизация') {
        statusMessage.value =
          (e as Error).message || 'Ошибка генерации варианта';
      }
    } finally {
      refreshLoadingByBlock.value.block1 = false;
      refreshLoadingByBlock.value.block2 = false;
      refreshLoadingByBlock.value.block3 = false;
    }
  };

  /**
   * Refresh block - requires authentication
   */
  const refreshBlock = async (block: RuntimeVariantBlockKey) => {
    // Check auth first
    if (!checkSubscription()) return;

    refreshLoadingByBlock.value[block] = true;
    try {
      const data = await authFetch<{ variant: GeneratedVariant }>(
        '/variants/runtime/refresh-block',
        {
          method: 'POST',
          body: {
            ...buildPayload(),
            block,
            variant: variant.value,
          },
        },
        true,
      );
      variant.value = data.variant;
      checkedAnswers.value.clear();
    } catch (e) {
      if ((e as Error).message !== 'Требуется авторизация') {
        statusMessage.value =
          (e as Error).message || `Ошибка обновления блока ${block}`;
      }
    } finally {
      refreshLoadingByBlock.value[block] = false;
    }
  };

  /**
   * Refresh task - requires authentication
   */
  const refreshTask = async (taskKey: VariantTaskKey) => {
    // Check auth first
    if (!checkSubscription()) return;

    refreshLoadingByTask.value[taskKey] = true;
    try {
      const data = await authFetch<{ variant: GeneratedVariant }>(
        '/variants/runtime/refresh-task',
        {
          method: 'POST',
          body: {
            ...buildPayload(),
            taskKey,
            variant: variant.value,
          },
        },
        true,
      );
      variant.value = data.variant;
      checkedAnswers.value.delete(taskKey);
    } catch (e) {
      if ((e as Error).message !== 'Требуется авторизация') {
        statusMessage.value =
          (e as Error).message || `Ошибка обновления задания ${taskKey}`;
      }
    } finally {
      refreshLoadingByTask.value[taskKey] = false;
    }
  };

  const checkSubscription = () => {
    if (!isAuthenticated.value) {
      openLoginModal();
      statusMessage.value = 'Для обновления блока необходимо войти';
      return false;
    } else if (isLocked.value) {
      showPaywall();
      statusMessage.value =
        'Обновления варианта ограничены. Пожалуйста, оформите подписку.';
      return false;
    }
    return true;
  };

  return {
    pregenerateVariant,
    generateVariant,
    refreshBlock,
    refreshTask,
  };
};
