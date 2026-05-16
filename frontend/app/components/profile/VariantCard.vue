<script setup lang="ts">
/**
 * Variant card component for displaying saved variants
 */
import type { SavedVariant } from '@/stores/variants';

const props = defineProps<{
  variant: SavedVariant;
}>();

const emit = defineEmits<{
  open: [variant: SavedVariant];
  download: [variant: SavedVariant];
  print: [variant: SavedVariant];
  delete: [variant: SavedVariant];
}>();

const variantsStore = useVariantsStore();

const title = computed(() => {
  return variantsStore.getVariantTitle(props.variant.variant);
});

const formattedDate = computed(() => {
  return variantsStore.formatDate(props.variant.createdAt);
});

const handleOpen = () => {
  emit('open', props.variant);
};

const handleDownload = () => {
  emit('download', props.variant);
};

const handlePrint = () => {
  emit('print', props.variant);
};

const handleDelete = () => {
  emit('delete', props.variant);
};
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-lg text-gray-900 truncate">
          {{ title }}
        </h3>
        <p class="text-sm text-gray-500 mt-1">
          Создан: {{ formattedDate }}
        </p>
      </div>
      <span
        class="ml-3 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
      >
        #{{ variant.id }}
      </span>
    </div>

    <!-- Variant Preview Info -->
    <div class="text-sm text-gray-600 mb-4 space-y-1">
      <p v-if="variant.variant.work?.author">
        <span class="text-gray-400">Автор:</span> {{ variant.variant.work.author }}
      </p>
      <p v-if="variant.variant.poem?.author">
        <span class="text-gray-400">Поэт:</span> {{ variant.variant.poem.author }}
      </p>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
      <button
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        @click="handleOpen"
      >
        <UIcon name="i-lucide-external-link" class="w-4 h-4" />
        Открыть
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        @click="handleDownload"
      >
        <UIcon name="i-lucide-download" class="w-4 h-4" />
        Скачать
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        @click="handlePrint"
      >
        <UIcon name="i-lucide-printer" class="w-4 h-4" />
        Печать
      </button>
      <button
        class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors ml-auto"
        @click="handleDelete"
      >
        <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
