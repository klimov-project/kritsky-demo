import { defineStore } from 'pinia';
import type { GeneratedVariant } from '@/types/generatedVariant';

export interface SavedVariant {
  id: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  variant: GeneratedVariant;
}

export interface SavedVariantsResponse {
  items: SavedVariant[];
}

export const useVariantsStore = defineStore('variants', () => {
  const savedVariants = ref<SavedVariant[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // Demo variant + update limits (for demo users)
  const demoVariant = ref<SavedVariant | null>(null);
  const demoUpdateCounts = ref<Record<string, number>>({});

  const DEMO_VARIANT_LS_KEY = 'demoVariant';
  const DEMO_COUNTS_LS_KEY = 'demoUpdateCounts';

  const loadDemoState = () => {
    try {
      const raw = localStorage.getItem(DEMO_VARIANT_LS_KEY);
      if (raw) demoVariant.value = JSON.parse(raw) as SavedVariant;
      const rawCounts = localStorage.getItem(DEMO_COUNTS_LS_KEY);
      if (rawCounts)
        demoUpdateCounts.value = JSON.parse(rawCounts) as Record<
          string,
          number
        >;
    } catch (e) {
      console.warn('Failed to load demo state', e);
    }
  };

  const saveDemoState = () => {
    try {
      localStorage.setItem(
        DEMO_VARIANT_LS_KEY,
        JSON.stringify(demoVariant.value),
      );
      localStorage.setItem(
        DEMO_COUNTS_LS_KEY,
        JSON.stringify(demoUpdateCounts.value || {}),
      );
    } catch (e) {
      console.warn('Failed to save demo state', e);
    }
  };

  const setDemoVariant = (v: SavedVariant | null) => {
    demoVariant.value = v;
    saveDemoState();
  };

  const getDemoUpdateCount = (taskKey: string) => {
    return demoUpdateCounts.value[taskKey] || 0;
  };

  const canUpdateTask = (taskKey: string, isPro = false) => {
    if (isPro) return true;
    return getDemoUpdateCount(taskKey) < 3;
  };

  const recordDemoUpdate = (taskKey: string) => {
    demoUpdateCounts.value[taskKey] = getDemoUpdateCount(taskKey) + 1;
    saveDemoState();
    return demoUpdateCounts.value[taskKey];
  };

  const authApi = useAuthApi();
  const { isDownloadingPdf, isInitialLoading } = useVariantState();

  /**
   * Synchronize the global loading flag with PDF download, initLoad etc...
   */
  watch(
    isDownloadingPdf,
    (newVal) => {
      isLoading.value = newVal;
    },
    { immediate: true },
  );
  watch(
    isInitialLoading,
    (newVal) => {
      isLoading.value = newVal;
    },
    { immediate: true },
  );

  // Initialize demo state from localStorage
  if (typeof window !== 'undefined') {
    loadDemoState();
  }

  /**
   * Fetch saved variants from backend
   */
  const fetchSavedVariants = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await authApi.apiWithAuth<SavedVariantsResponse>(
        '/variants',
      );
      savedVariants.value = data.items || [];
      return data.items;
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value =
        fetchError?.data?.message || 'Ошибка загрузки сохраненных вариантов';
      console.error('[variantStore] Fetch saved variants error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Save current variant to profile
   */
  const saveVariant = async (variant: GeneratedVariant) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await authApi.apiWithAuth('/variants', {
        method: 'POST',
        body: {
          title: `Variant - ${new Date().toLocaleDateString('ru-RU')}`,
          description: `Generated variant`,
          variant,
        },
      });

      const newVariant: SavedVariant = {
        id: Number(response.id) || Date.now(),
        userId: response.userId || 0,
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
        variant,
      };
      savedVariants.value.unshift(newVariant);
      return newVariant;
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value = fetchError?.data?.message || 'Ошибка сохранения варианта';
      console.error('[variantStore] Save variant error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete variant
   */
  const deleteVariant = async (variantId: number) => {
    isLoading.value = true;
    error.value = null;
    try {
      await authApi.apiWithAuth(`/variants/${variantId}`, {
        method: 'DELETE',
      });
      savedVariants.value = savedVariants.value.filter(
        (v) => v.id !== variantId,
      );
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value = fetchError?.data?.message || 'Ошибка удаления варианта';
      console.error('[variantStore] Delete variant error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get variant by ID
   */
  const getVariantById = (id: number) => {
    return savedVariants.value.find((v) => v.id === id);
  };

  /**
   * Clear saved variants
   */
  const clearVariants = () => {
    savedVariants.value = [];
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get variant title (from work or first task)
   */
  const getVariantTitle = (variant: GeneratedVariant) => {
    if (variant.work?.title && variant.work?.author) {
      return `${variant.work.author} - ${variant.work.title}`;
    }
    return 'Вариант ЕГЭ';
  };

  return {
    savedVariants,
    isLoading,
    error,
    fetchSavedVariants,
    saveVariant,
    deleteVariant,
    getVariantById,
    clearVariants,
    formatDate,
    getVariantTitle,
    // Demo API
    demoVariant,
    setDemoVariant,
    canUpdateTask,
    recordDemoUpdate,
    getDemoUpdateCount,
  };
});
