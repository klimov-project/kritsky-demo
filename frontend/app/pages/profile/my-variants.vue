<script setup lang="ts">
/**
 * My Variants page - displays saved test variants
 */
import type { SavedVariant } from '@/stores/variants';

definePageMeta({
  middleware: 'auth',
});

const toast = useToast();
const variantsStore = useVariantsStore();
const { savedVariants, isLoading, error } = storeToRefs(variantsStore);
const { downloadVariantPdf, printVariant } = useVariantExport();

const isDeleting = ref<number | null>(null);
const showDeleteConfirm = ref(false);
const variantToDelete = ref<SavedVariant | null>(null);

// Load saved variants on mount
onMounted(async () => {
  try {
    await variantsStore.fetchSavedVariants();
  } catch (err) {
    console.error('Failed to load saved variants:', err);
  }
});

const handleOpenVariant = (variant: SavedVariant) => {
  // Navigate to variant view page
  navigateTo(`/variant/${variant.id}`);
};

const handleDownloadVariant = async (variant: SavedVariant) => {
  // For now, show a message that this functionality requires opening the variant first
  toast.add({
    title: 'Скачивание',
    description: 'Откройте вариант для скачивания PDF',
    color: 'info',
    icon: 'i-lucide-info',
  });
};

const handlePrintVariant = (variant: SavedVariant) => {
  // For now, show a message that this functionality requires opening the variant first
  toast.add({
    title: 'Печать',
    description: 'Откройте вариант для печати',
    color: 'info',
    icon: 'i-lucide-info',
  });
};

const confirmDelete = (variant: SavedVariant) => {
  variantToDelete.value = variant;
  showDeleteConfirm.value = true;
};

const handleDeleteVariant = async () => {
  if (!variantToDelete.value) return;

  isDeleting.value = variantToDelete.value.id;
  try {
    await variantsStore.deleteVariant(variantToDelete.value.id);
    toast.add({
      title: 'Удалено',
      description: 'Вариант успешно удален',
      color: 'success',
      icon: 'i-lucide-trash-2',
    });
  } catch (err) {
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось удалить вариант',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  } finally {
    isDeleting.value = null;
    showDeleteConfirm.value = false;
    variantToDelete.value = null;
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  variantToDelete.value = null;
};
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Main Card -->
      <div class="bg-white rounded-3xl p-6 md:p-10 shadow-sm">
        <div class="flex flex-col lg:flex-row gap-10">
          <!-- Sidebar -->
          <ProfileSidebar active-item="my-variants" />

          <!-- Main Content -->
          <main class="flex-1">
            <!-- Header -->
            <div
              class="flex items-center justify-between border-b border-gray-200 mb-8 pb-4"
            >
              <h1 class="text-2xl font-bold">Мои варианты</h1>
              <span class="text-sm text-gray-500">
                Всего: {{ savedVariants.length }}
              </span>
            </div>

            <!-- Loading State -->
            <div
              v-if="isLoading"
              class="flex items-center justify-center py-12"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="w-8 h-8 text-gray-400 animate-spin"
              />
            </div>

            <!-- Error State -->
            <div
              v-else-if="error"
              class="flex flex-col items-center justify-center py-12 text-center"
            >
              <UIcon
                name="i-lucide-alert-circle"
                class="w-12 h-12 text-red-400 mb-4"
              />
              <p class="text-gray-600 mb-4">{{ error }}</p>
              <button
                class="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="variantsStore.fetchSavedVariants()"
              >
                Попробовать снова
              </button>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="savedVariants.length === 0"
              class="flex flex-col items-center justify-center py-12 text-center"
            >
              <UIcon
                name="i-lucide-folder-open"
                class="w-16 h-16 text-gray-300 mb-4"
              />
              <h3 class="text-lg font-medium text-gray-700 mb-2">
                У вас пока нет сохраненных вариантов
              </h3>
              <p class="text-gray-500 mb-6 max-w-md">
                Создайте вариант в конструкторе и сохраните его, чтобы он
                появился здесь
              </p>
              <NuxtLink
                to="/create-variant"
                class="px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Перейти в конструктор
              </NuxtLink>
            </div>

            <!-- Variants Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VariantCard
                v-for="variant in savedVariants"
                :key="variant.id"
                :variant="variant"
                @open="handleOpenVariant"
                @download="handleDownloadVariant"
                @print="handlePrintVariant"
                @delete="confirmDelete"
              />
            </div>
          </main>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
            >
              <UIcon name="i-lucide-trash-2" class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">Удалить вариант?</h3>
              <p class="text-sm text-gray-500">Это действие нельзя отменить</p>
            </div>
          </div>

          <div class="flex gap-3 justify-end mt-6">
            <button
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              @click="cancelDelete"
            >
              Отмена
            </button>
            <button
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              :disabled="isDeleting !== null"
              @click="handleDeleteVariant"
            >
              <UIcon
                v-if="isDeleting !== null"
                name="i-lucide-loader-2"
                class="w-4 h-4 animate-spin"
              />
              Удалить
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
