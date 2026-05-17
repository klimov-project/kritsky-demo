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

  /**
   * Fetch saved variants from /api/variants/list
   */
  const fetchSavedVariants = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await $fetch<SavedVariantsResponse>('/api/variants/list');
      savedVariants.value = data.items || [];
      return data.items;
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value =
        fetchError?.data?.message || 'Ошибка загрузки сохраненных вариантов';
      console.error('[v0] Fetch saved variants error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Save current variant to profile
   * POST /api/variants/save
   */
  const saveVariant = async (variant: GeneratedVariant) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await $fetch('/api/variants/save', {
        method: 'POST',
        body: {
          title: `Variant - ${new Date().toLocaleDateString('ru-RU')}`,
          description: `Generated variant`,
          variant,
        },
      });
      // Transform response to SavedVariant format
      const newVariant: SavedVariant = {
        id: parseInt(response.id) || Date.now(),
        userId: 0,
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        variant,
      };
      savedVariants.value.unshift(newVariant);
      return newVariant;
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value = fetchError?.data?.message || 'Ошибка сохранения варианта';
      console.error('[v0] Save variant error:', err);
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
      await $fetch(`/api/variants/${variantId}`, {
        method: 'DELETE',
      });
      // Remove from local list
      savedVariants.value = savedVariants.value.filter(
        (v) => v.id !== variantId,
      );
    } catch (err) {
      const fetchError = err as { data?: { message?: string } };
      error.value = fetchError?.data?.message || 'Ошибка удаления варианта';
      console.error('[v0] Delete variant error:', err);
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
  };
});
