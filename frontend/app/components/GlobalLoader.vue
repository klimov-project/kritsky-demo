<script setup lang="ts">
// const variantsStore = useVariantsStore();
const { isInitialLoading, isDownloadingPdf } = useVariantState();
const message = computed(() => {
  if (isInitialLoading.value) {
    return 'Подготовка варианта...';
  }
  if (isDownloadingPdf.value) {
    return 'Скачивание PDF...';
  }
  return 'Обновление варианта...';
});
</script>
<template>
  <div
    class="no-print fixed inset-0 z-50 flex items-center justify-center bg-white/45 backdrop-blur-[2px]"
  >
    <div
      class="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 text-gray-400 animate-spin"
      />
      {{ message }}
    </div>
  </div>
</template>
